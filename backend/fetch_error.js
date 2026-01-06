
async function run() {
    try {
        const res = await fetch('http://localhost:4000/api/seed');
        console.log('Status:', res.status);
        if (!res.ok) {
            const data = await res.json();
            console.log('Error Body:', JSON.stringify(data, null, 2));
        } else {
            console.log('Success');
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}
run();
