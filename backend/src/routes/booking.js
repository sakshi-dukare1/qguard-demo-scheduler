const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const dns = require('dns').promises;

const {
    getAvailableSlots,
    createBooking,
    getBookingByToken,
    rescheduleBooking,
    cancelBooking
} = require('../controllers/booking');

// Helper: Validate timezone
const isValidTimezone = (timezone) => {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

// Helper: Check common TLD typos
const commonTldTypos = {
    '.con': '.com',
    '.cmo': '.com',
    '.ocm': '.com',
    '.comm': '.com',
    '.neto': '.net',
    '.ogr': '.org',
    '.orgg': '.org',
};

const checkCommonTldTypo = (email) => {
    const lowerEmail = email.toLowerCase();
    const atIndex = lowerEmail.lastIndexOf('@');
    if (atIndex === -1) return null;
    
    const domain = lowerEmail.substring(atIndex);
    
    for (const typo in commonTldTypos) {
        if (domain.endsWith(typo)) {
            return {
                original: email,
                suggestion: email.slice(0, -typo.length) + commonTldTypos[typo]
            };
        }
    }
    return null;
};

// Helper: Check if domain has MX records (with timeout)
const domainHasMailServer = async (email) => {
    const domain = email.split('@')[1];
    if (!domain) return false;
    try {
        // Add timeout to DNS lookup
        const records = await Promise.race([
            dns.resolveMx(domain),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), 3000))
        ]);
        return Array.isArray(records) && records.length > 0;
    } catch {
        // If DNS fails, assume it's valid (don't block the user)
        return true;
    }
};

// Get available slots
router.get('/slots', getAvailableSlots);

// Create booking with LAYERED validation
router.post('/bookings', [
    body('visitor_name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/)
        .withMessage('Name can contain only letters, spaces, hyphens and apostrophes'),

    // EMAIL VALIDATION - LAYERED APPROACH
    body('visitor_email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isLength({ max: 254 })
        .withMessage('Email address is too long')
        .custom(async (email) => {
            // LAYER 1: Format validation using validator.js
            if (!validator.isEmail(email)) {
                throw new Error('Please enter a valid email address');
            }
            return true;
        })
        .custom(async (email) => {
            // LAYER 2: Check common typos (.con -> .com)
            const typo = checkCommonTldTypo(email);
            if (typo) {
                throw new Error(`Did you mean "${typo.suggestion}"?`);
            }
            return true;
        })
        .custom(async (email) => {
            // LAYER 3: Check if domain has MX records (optional - won't block valid domains)
            // This is a soft check - if DNS fails, we still accept the email
            const hasMX = await domainHasMailServer(email);
            // Only reject if we're CERTAIN the domain doesn't exist
            // For safety, we don't reject here - we just log
            if (!hasMX) {
                console.log(`⚠️ Warning: No MX records found for ${email}, but accepting anyway`);
            }
            return true; // Always accept - don't block valid users
        }),

    body('company')
        .trim()
        .notEmpty()
        .withMessage('Company is required')
        .isLength({ min: 2, max: 150 })
        .withMessage('Company name must be between 2 and 150 characters'),

    body('job_title')
        .trim()
        .notEmpty()
        .withMessage('Job title is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Job title must be between 2 and 100 characters'),

    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^\+?[1-9]\d{7,14}$/)
        .withMessage('Please enter a valid phone number (8-15 digits, optional + prefix)'),

    body('slot_start')
        .notEmpty()
        .withMessage('Slot start is required')
        .isISO8601()
        .withMessage('Slot start must be a valid date and time'),

    body('slot_end')
        .notEmpty()
        .withMessage('Slot end is required')
        .isISO8601()
        .withMessage('Slot end must be a valid date and time'),

    body('timezone')
        .trim()
        .notEmpty()
        .withMessage('Timezone is required')
        .custom(isValidTimezone)
        .withMessage('Invalid timezone'),

    body().custom((value, { req }) => {
        const { slot_start, slot_end } = req.body;
        if (!slot_start || !slot_end) return true;

        const start = new Date(slot_start);
        const end = new Date(slot_end);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        if (end <= start) {
            throw new Error('Slot end time must be after start time');
        }

        const durationMinutes = (end - start) / (1000 * 60);
        if (durationMinutes !== 30) {
            throw new Error('Demo slot must be exactly 30 minutes');
        }

        return true;
    })
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}, createBooking);

// Get booking by token
router.get('/bookings/:token', getBookingByToken);

// Reschedule booking with validation
router.put('/bookings/:token/reschedule', [
    body('slot_start')
        .notEmpty()
        .withMessage('Slot start is required')
        .isISO8601()
        .withMessage('Slot start must be a valid date and time'),

    body('slot_end')
        .notEmpty()
        .withMessage('Slot end is required')
        .isISO8601()
        .withMessage('Slot end must be a valid date and time'),

    body().custom((value, { req }) => {
        const { slot_start, slot_end } = req.body;
        if (!slot_start || !slot_end) return true;

        const start = new Date(slot_start);
        const end = new Date(slot_end);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        if (end <= start) {
            throw new Error('Slot end time must be after start time');
        }

        const durationMinutes = (end - start) / (1000 * 60);
        if (durationMinutes !== 30) {
            throw new Error('Demo slot must be exactly 30 minutes');
        }

        return true;
    })
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}, rescheduleBooking);

// Cancel booking
router.put('/bookings/:token/cancel', cancelBooking);

module.exports = router;