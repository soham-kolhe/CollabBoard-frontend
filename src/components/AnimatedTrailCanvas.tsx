import { useRef, useEffect } from 'react';

const drawingTools = [
    { symbol: "✎", color: "#6366f1" },   // pencil
    { symbol: "🖌", color: "#a855f7" },   // brush
    { symbol: "🎨", color: "#ec4899" },   // palette
    { symbol: "✒", color: "#10b981" },   // pen
    { symbol: "🖍", color: "#f59e0b" },   // crayon
    { symbol: "✏️", color: "#ef4444" },  // classic pencil
    { symbol: "🧽", color: "#22c55e" },   // sponge (for shading)
    { symbol: "🧴", color: "#06b6d4" },   // spray (paint spray feel)
    { symbol: "🪶", color: "#f472b6" },   // feather (calligraphy style)
];

const AnimatedTrailCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trails = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        let lastMousePos = { x: -100, y: -100 };

        const handleMouseMove = (e: MouseEvent) => {
            const dist = Math.hypot(e.clientX - lastMousePos.x, e.clientY - lastMousePos.y);
            if (dist > 15) { 
                const tool = drawingTools[Math.floor(Math.random() * drawingTools.length)];
                trails.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    symbol: tool.symbol,
                    color: tool.color,
                    opacity: 0.8,
                    size: Math.random() * 8 + 22,
                    rotation: Math.random() * Math.PI,
                    velocity: { x: (Math.random() - 0.5) * 1, y: (Math.random() - 0.5) * 1 - 0.5 }
                });
                lastMousePos = { x: e.clientX, y: e.clientY };
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            trails.current = trails.current.filter(t => t.opacity > 0.01);

            trails.current.forEach(t => {
                ctx.save();
                ctx.globalAlpha = t.opacity;
                ctx.fillStyle = t.color;
                ctx.font = `${t.size}px serif`;
                ctx.textAlign = "center";
                ctx.translate(t.x, t.y);
                ctx.rotate(t.rotation);
                ctx.fillText(t.symbol, 0, 0);
                ctx.restore();

                t.opacity -= 0.015;
                t.x += t.velocity.x;
                t.y += t.velocity.y;
                t.rotation += 0.02;
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-transparent pointer-events-none" />;
};

export default AnimatedTrailCanvas;