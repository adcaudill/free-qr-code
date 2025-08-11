import React, { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, Slider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import type { QrConfig } from '../types';

interface Props { config: QrConfig; onChange: (patch: Partial<QrConfig>) => void; }
interface Selection { x: number; y: number; size: number; }

export const LogoUploader: React.FC<Props> = ({ config, onChange }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [selection, setSelection] = useState<Selection>({ x: 0, y: 0, size: 100 });
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<null | { type: 'move' | 'resize'; offsetX: number; offsetY: number }>(null);

    const loadFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                const side = Math.min(img.width, img.height);
                setSelection({ x: (img.width - side) / 2, y: (img.height - side) / 2, size: side });
                // adaptive scaling
                const targetMax = 600, targetMin = 260;
                let s = 1;
                if (Math.max(img.width, img.height) > targetMax) s = targetMax / Math.max(img.width, img.height);
                else if (Math.min(img.width, img.height) < targetMin) s = targetMin / Math.min(img.width, img.height);
                setScale(s);
                setDialogOpen(true);
            };
            if (typeof reader.result === 'string') img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    const handleFiles = (files: FileList | null) => { if (files && files[0]) loadFile(files[0]); };
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const applyCrop = () => {
        if (!image) return;
        const { x, y, size } = selection;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.drawImage(image, x, y, size, size, 0, 0, size, size);
        onChange({ logoCroppedDataUrl: canvas.toDataURL('image/png') });
        setDialogOpen(false);
    };

    const clientToImage = (clientX: number, clientY: number) => {
        if (!containerRef.current || !image) return { ix: 0, iy: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return { ix: (clientX - rect.left) / scale, iy: (clientY - rect.top) / scale };
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (!image) return;
        const { ix, iy } = clientToImage(e.clientX, e.clientY);
        const handleArea = 20 / scale;
        const inHandle = ix >= selection.x + selection.size - handleArea && iy >= selection.y + selection.size - handleArea;
        if (inHandle) {
            dragState.current = { type: 'resize', offsetX: ix - (selection.x + selection.size), offsetY: iy - (selection.y + selection.size) };
            return;
        }
        const inside = ix >= selection.x && ix <= selection.x + selection.size && iy >= selection.y && iy <= selection.y + selection.size;
        if (inside) dragState.current = { type: 'move', offsetX: ix - selection.x, offsetY: iy - selection.y };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragState.current || !image) return;
        const { ix, iy } = clientToImage(e.clientX, e.clientY);
        if (dragState.current.type === 'move') {
            let nx = ix - dragState.current.offsetX;
            let ny = iy - dragState.current.offsetY;
            nx = Math.max(0, Math.min(nx, image.width - selection.size));
            ny = Math.max(0, Math.min(ny, image.height - selection.size));
            setSelection(s => ({ ...s, x: nx, y: ny }));
        } else {
            let newSize = Math.max(32, Math.max(ix - selection.x, iy - selection.y));
            newSize = Math.min(newSize, image.width - selection.x, image.height - selection.y, Math.min(image.width, image.height));
            setSelection(s => ({ ...s, size: newSize }));
        }
    };
    const endDrag = () => { dragState.current = null; };

    const sliderChange = (_: Event, v: number | number[]) => {
        if (!image) return;
        let size = v as number;
        size = Math.max(32, Math.min(size, Math.min(image.width, image.height)));
        let { x, y } = selection;
        if (x + size > image.width) x = image.width - size;
        if (y + size > image.height) y = image.height - size;
        setSelection({ x, y, size });
    };

    return (
        <Box>
            <Box
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => inputRef.current?.click()}
                sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1, textAlign: 'center', cursor: 'pointer', bgcolor: 'background.default', '&:hover': { bgcolor: 'action.hover' } }}
                aria-label="Drop logo image here or click to select"
            >
                <Typography variant="body2" color="text.secondary">{config.logoCroppedDataUrl ? 'Replace logo (opens crop dialog)' : 'Drag & drop logo, or click to choose'}</Typography>
                {config.logoCroppedDataUrl && <Box mt={1}><img src={config.logoCroppedDataUrl} alt="Logo preview" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} /></Box>}
            </Box>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Crop Logo</DialogTitle>
                <DialogContent>
                    {image && (
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <Box
                                ref={containerRef}
                                sx={{ position: 'relative', width: image.width * scale, height: image.height * scale, userSelect: 'none' }}
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={endDrag}
                                onMouseLeave={endDrag}
                            >
                                <img
                                    src={image.src}
                                    alt="To crop"
                                    draggable={false}
                                    onDragStart={e => e.preventDefault()}
                                    style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                                />
                                <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                    <svg width={image.width * scale} height={image.height * scale} style={{ display: 'block' }}>
                                        <defs>
                                            <mask id="logo-crop-mask">
                                                <rect x={0} y={0} width={image.width * scale} height={image.height * scale} fill="white" />
                                                <rect x={selection.x * scale} y={selection.y * scale} width={selection.size * scale} height={selection.size * scale} fill="black" />
                                            </mask>
                                        </defs>
                                        <rect x={0} y={0} width={image.width * scale} height={image.height * scale} fill="rgba(0,0,0,0.45)" mask="url(#logo-crop-mask)" />
                                        <rect x={selection.x * scale} y={selection.y * scale} width={selection.size * scale} height={selection.size * scale} fill="none" stroke="#fff" strokeWidth={2} />
                                        <rect x={(selection.x + selection.size) * scale - 10} y={(selection.y + selection.size) * scale - 10} width={20} height={20} fill="#fff" stroke="#000" strokeWidth={1} />
                                    </svg>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    {image && (
                        <Stack mt={2} direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption">Crop size</Typography>
                            <Slider min={32} max={Math.min(image.width, image.height)} value={selection.size} onChange={sliderChange} />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={applyCrop} variant="contained" disabled={!image}>Apply</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
