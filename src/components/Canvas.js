import React, { useEffect, useRef } from 'react';

const Canvas = ({ simulationManager, selectedElement }) => {
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const mousePositionRef = useRef({ x: 0, y: 0 });
    const spawnIntervalRef = useRef(null);

    const addElementAtPosition = (x, y) => {
        const grid = simulationManager.getGrid();
        if (x >= 0 && x < grid.length && y >= 0 && y < grid[0].length) {
            simulationManager.addElement(x, y, selectedElement);
        }
    };

    const getGridCoordinatesFromMouseEvent = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const grid = simulationManager.getGrid();
        const cellSizeX = canvas.width / grid.length;
        const cellSizeY = canvas.height / grid[0].length;

        const x = Math.floor((e.clientX - rect.left) / cellSizeX);
        const y = Math.floor((e.clientY - rect.top) / cellSizeY);

        return { x, y };
    };

    const startDrawing = () => {
        spawnIntervalRef.current = setInterval(() => {
            if (isDrawingRef.current) {
                const { x, y } = mousePositionRef.current;
                addElementAtPosition(x, y);
            }
        }, 50);
    };

    const handleMouseDown = (e) => {
        isDrawingRef.current = true;
        const { x, y } = getGridCoordinatesFromMouseEvent(e);
        mousePositionRef.current = { x, y };
        addElementAtPosition(x, y);
        startDrawing();
    };

    const handleMouseMove = (e) => {
        if (isDrawingRef.current) {
            const { x, y } = getGridCoordinatesFromMouseEvent(e);
            mousePositionRef.current = { x, y };
        }
    };

    const stopDrawing = () => {
        isDrawingRef.current = false;
        if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current);
            spawnIntervalRef.current = null;
        }
    };

    const handleMouseUp = () => {
        stopDrawing();
    };

    const handleMouseLeave = () => {
        stopDrawing();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseup', handleMouseUp);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        };
    }, [simulationManager, selectedElement]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const render = () => {
            const grid = simulationManager.getGrid();
            const cellSizeX = canvas.width / grid.length;
            const cellSizeY = canvas.height / grid[0].length;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let x = 0; x < grid.length; x++) {
                for (let y = 0; y < grid[0].length; y++) {
                    const element = grid[x][y];
                    if (element) {
                        ctx.fillStyle = element.getColor();
                        ctx.fillRect(x * cellSizeX, y * cellSizeY, cellSizeX, cellSizeY);
                    }
                }
            }

            requestAnimationFrame(render);
        };

        render();
    }, [simulationManager]);

    return (
        <canvas
            ref={canvasRef}
            width={1200}
            height={600}
            style={{ border: '2px solid white' }}
        />
    );
};

export default Canvas;
