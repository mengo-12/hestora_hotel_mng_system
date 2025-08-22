// app/api/hk/tasks/route.js
export async function GET() {
    const tasks = await prisma.housekeepingTask.findMany({ include: { room: true, assignedTo: true } });
    return new Response(JSON.stringify(tasks), { status: 200 });
}

export async function POST(req) {
    const data = await req.json();
    const task = await prisma.housekeepingTask.create({ data });
    io.emit("HK_TASK_UPDATED", task);
    return new Response(JSON.stringify(task), { status: 201 });
}

export async function PUT(req, { params }) {
    const data = await req.json();
    const task = await prisma.housekeepingTask.update({ where: { id: params.id }, data });
    io.emit("HK_TASK_UPDATED", task);
    return new Response(JSON.stringify(task), { status: 200 });
}
