// Node 18+ has native fetch
// Actually, since Node 18+ fetch is global.

async function testLogin() {
    try {
        console.log("1. Seeding Database...");
        const seedRes = await fetch('http://localhost:4000/api/seed');
        const seedData = await seedRes.json();
        console.log("Seed Result:", seedData);

        console.log("\n2. Attempting Login...");
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "admin@darma.com",
                password: "admin123"
            })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            console.log("\n✅ LOGIN SUCCESS!");
            console.log("Token:", data.token ? "Received" : "Missing");
            console.log("User:", data.user);
        } else {
            console.log("\n❌ LOGIN FAILED");
            console.log("Status:", loginRes.status);
            const errText = await loginRes.text();
            console.log("Error:", errText);
        }

    } catch (e) {
        console.error("Test Script Error:", e);
    }
}

testLogin();
