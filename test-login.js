async function testLogin() {
    try {
        console.log('Testing admin login...');
        
        const response = await fetch('http://localhost:3000/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'admin',
                code: 'admin123'
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.token) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed:', data.error);
        }
        
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

testLogin();
