const supabase = require('./config/supabase');

async function testConnection() {
    console.log('Testing Supabase connection...');
    
    try {
        // Test 1: Simple query with explicit schema
        const { data, error, count } = await supabase
            .from('available_slots')
            .select('*', { count: 'exact', head: false })
            .limit(1);
        
        if (error) {
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
        } else {
            console.log('✅ Success! Tables are accessible');
            console.log('Data:', data);
            console.log('Count:', count);
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

testConnection();