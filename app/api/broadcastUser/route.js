export async function POST(req) {
    const data = await req.json();
    
    // نرسل البيانات لجميع العملاء المشتركين عبر socket.io أو أي broadcast آخر
    await fetch("http://localhost:3001/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "USER_UPDATED", data }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
