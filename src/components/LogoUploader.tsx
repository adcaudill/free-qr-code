import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Button, Stack, Typography, Slider, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import type { QrConfig } from '../types';

interface Props { config: QrConfig; onChange: (patch: Partial<QrConfig>) => void; }
interface Selection { x: number; y: number; w: number; h: number; }

// Square and Round keep a 1:1 selection; Free lets width and height move
// independently; All takes the image as it is, whatever its shape.
type CropShape = 'square' | 'round' | 'free' | 'all';
const LOCKED_TO_SQUARE: CropShape[] = ['square', 'round'];
const MIN_CROP = 16;

const CROP_SHAPES: { value: CropShape; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'round', label: 'Round' },
    { value: 'free', label: 'User defined' },
    { value: 'all', label: 'All' }
];

function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), Math.max(min, max)); }

const CHECKER = 'rgba(128,128,128,0.18)';
const CHECKERBOARD = {
    image: `linear-gradient(45deg, ${CHECKER} 25%, transparent 25%), linear-gradient(-45deg, ${CHECKER} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${CHECKER} 75%), linear-gradient(-45deg, transparent 75%, ${CHECKER} 75%)`,
    size: '16px 16px',
    position: '0 0, 0 8px, 8px -8px, -8px 0px'
};

export const LogoUploader: React.FC<Props> = ({ config, onChange }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [selection, setSelection] = useState<Selection>({ x: 0, y: 0, w: 100, h: 100 });
    const [shape, setShape] = useState<CropShape>('square');
    const [scale, setScale] = useState(1);
    const locked = LOCKED_TO_SQUARE.includes(shape);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<null | { type: 'move' | 'resize'; offsetX: number; offsetY: number }>(null);

    const loadFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                const side = Math.min(img.width, img.height);
                setShape('square');
                setSelection({ x: (img.width - side) / 2, y: (img.height - side) / 2, w: side, h: side });
                // Adaptive scaling, bounded by what the dialog can actually show:
                // the title, size slider and buttons take roughly 280px of height,
                // and anything larger makes the crop area overflow.
                const maxHeight = Math.max(240, Math.min(600, window.innerHeight - 280));
                const maxWidth = Math.max(240, Math.min(600, window.innerWidth - 100));
                const fit = Math.min(maxWidth / img.width, maxHeight / img.height);
                const shortest = Math.min(img.width, img.height);
                let s = 1;
                if (fit < 1) s = fit;
                else if (shortest < 260) s = Math.min(260 / shortest, fit);
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

    // Switching shape has to bring the selection with it, or the radio would
    // claim a shape the crop does not have.
    const changeShape = (next: CropShape) => {
        setShape(next);
        if (!image) return;
        if (next === 'all') {
            setSelection({ x: 0, y: 0, w: image.width, h: image.height });
            return;
        }
        if (!LOCKED_TO_SQUARE.includes(next)) return;
        setSelection(s => {
            const side = Math.min(s.w, s.h, image.width, image.height);
            // keep the same centre while squaring off
            const x = clamp(s.x + (s.w - side) / 2, 0, image.width - side);
            const y = clamp(s.y + (s.h - side) / 2, 0, image.height - side);
            return { x, y, w: side, h: side };
        });
    };

    const applyCrop = () => {
        if (!image) return;
        const { x, y, w, h } = selection;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w); canvas.height = Math.round(h);
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        if (shape === 'round' && typeof ctx.ellipse === 'function') {
            // everything outside the circle stays transparent
            ctx.beginPath();
            ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2);
            ctx.clip();
        }
        ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
        onChange({ logoCroppedDataUrl: canvas.toDataURL('image/png') });
        setDialogOpen(false);
    };

    const clientToImage = (clientX: number, clientY: number) => {
        if (!containerRef.current || !image) return { ix: 0, iy: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return { ix: (clientX - rect.left) / scale, iy: (clientY - rect.top) / scale };
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (!image || shape === 'all') return;
        const { ix, iy } = clientToImage(e.clientX, e.clientY);
        const handleArea = 20 / scale;
        const inHandle = ix >= selection.x + selection.w - handleArea && iy >= selection.y + selection.h - handleArea;
        if (inHandle) {
            dragState.current = { type: 'resize', offsetX: ix - (selection.x + selection.w), offsetY: iy - (selection.y + selection.h) };
            return;
        }
        const inside = ix >= selection.x && ix <= selection.x + selection.w && iy >= selection.y && iy <= selection.y + selection.h;
        if (inside) dragState.current = { type: 'move', offsetX: ix - selection.x, offsetY: iy - selection.y };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragState.current || !image) return;
        const { ix, iy } = clientToImage(e.clientX, e.clientY);
        if (dragState.current.type === 'move') {
            const nx = clamp(ix - dragState.current.offsetX, 0, image.width - selection.w);
            const ny = clamp(iy - dragState.current.offsetY, 0, image.height - selection.h);
            setSelection(s => ({ ...s, x: nx, y: ny }));
        } else if (locked) {
            const side = clamp(
                Math.max(ix - selection.x, iy - selection.y),
                MIN_CROP,
                Math.min(image.width - selection.x, image.height - selection.y)
            );
            setSelection(s => ({ ...s, w: side, h: side }));
        } else {
            const w = clamp(ix - selection.x, MIN_CROP, image.width - selection.x);
            const h = clamp(iy - selection.y, MIN_CROP, image.height - selection.y);
            setSelection(s => ({ ...s, w, h }));
        }
    };
    const endDrag = () => { dragState.current = null; };

    const sliderChange = (_: Event, v: number | number[]) => {
        if (!image) return;
        const side = clamp(v as number, MIN_CROP, Math.min(image.width, image.height));
        setSelection(s => ({
            x: Math.min(s.x, image.width - side),
            y: Math.min(s.y, image.height - side),
            w: side,
            h: side
        }));
    };

    const moveSelection = useCallback((dx: number, dy: number) => {
        setSelection(s => {
            if (!image) return s;
            return {
                ...s,
                x: clamp(s.x + dx, 0, image.width - s.w),
                y: clamp(s.y + dy, 0, image.height - s.h)
            };
        });
    }, [image]);

    // dw/dh are applied together for the locked shapes, so one arrow key still
    // resizes a square as a square.
    const resizeSelection = useCallback((dw: number, dh: number) => {
        setSelection(s => {
            if (!image) return s;
            if (LOCKED_TO_SQUARE.includes(shape)) {
                const delta = dw !== 0 ? dw : dh;
                const side = clamp(s.w + delta, MIN_CROP, Math.min(image.width - s.x, image.height - s.y));
                return { ...s, w: side, h: side };
            }
            return {
                ...s,
                w: clamp(s.w + dw, MIN_CROP, image.width - s.x),
                h: clamp(s.h + dh, MIN_CROP, image.height - s.y)
            };
        });
    }, [image, shape]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!image || shape === 'all') return;
        const step = e.altKey ? 10 : 1; // allow faster movement with Alt
        switch (e.key) {
            case 'ArrowLeft':
                if (e.shiftKey) resizeSelection(-step, 0); else moveSelection(-step, 0); e.preventDefault(); break;
            case 'ArrowRight':
                if (e.shiftKey) resizeSelection(step, 0); else moveSelection(step, 0); e.preventDefault(); break;
            case 'ArrowUp':
                if (e.shiftKey) resizeSelection(0, -step); else moveSelection(0, -step); e.preventDefault(); break;
            case 'ArrowDown':
                if (e.shiftKey) resizeSelection(0, step); else moveSelection(0, step); e.preventDefault(); break;
            case '+':
            case '=':
                resizeSelection(step, step); e.preventDefault(); break;
            case '-':
            case '_':
                resizeSelection(-step, -step); e.preventDefault(); break;
            default:
                break;
        }
    };

    // Auto focus crop container when dialog opens with image. preventScroll
    // matters: the crop area is usually taller than the dialog's scroll box, and
    // focusing it otherwise scrolls it into view from the bottom, hiding the top
    // rows of the image.
    useEffect(() => {
        if (dialogOpen && image && containerRef.current) {
            containerRef.current.focus({ preventScroll: true });
            // scrollTop rather than scrollTo: the latter is missing in some
            // environments and this runs in an effect, where a throw is fatal
            const scroller = containerRef.current.parentElement?.closest('.MuiDialogContent-root');
            if (scroller) scroller.scrollTop = 0;
        }
    }, [dialogOpen, image]);

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
                {config.logoCroppedDataUrl && (
                    <Box mt={1} display="flex" justifyContent="center">
                        {/* checkerboard so a white or light logo is still visible here */}
                        <Box sx={{
                            display: 'inline-flex',
                            p: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 0.5,
                            backgroundColor: 'common.white',
                            backgroundImage: CHECKERBOARD.image,
                            backgroundSize: CHECKERBOARD.size,
                            backgroundPosition: CHECKERBOARD.position
                        }}>
                            <img src={config.logoCroppedDataUrl} alt="Logo preview" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
                        </Box>
                    </Box>
                )}
            </Box>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Crop Logo</DialogTitle>
                <DialogContent>
                    {image && (
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <Box
                                ref={containerRef}
                                sx={{
                                    position: 'relative',
                                    // content-box so the frame sits outside the image and the
                                    // overlay svg stays aligned with it
                                    boxSizing: 'content-box',
                                    width: image.width * scale,
                                    height: image.height * scale,
                                    userSelect: 'none',
                                    // Artwork often runs edge to edge, which looks cut off without
                                    // something marking where the image actually ends. The
                                    // checkerboard does the same job for transparent areas.
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    backgroundColor: 'common.white',
                                    backgroundImage: CHECKERBOARD.image,
                                    backgroundSize: CHECKERBOARD.size,
                                    backgroundPosition: CHECKERBOARD.position,
                                    outline: 'none',
                                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
                                }}
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={endDrag}
                                onMouseLeave={endDrag}
                                onKeyDown={onKeyDown}
                                role="group"
                                aria-label="Crop selection. Arrow keys move. Shift+Arrow resize. Alt for faster movement."
                                tabIndex={0}
                                aria-roledescription="crop area"
                                aria-describedby="crop-instructions"
                                data-crop-x={selection.x}
                                data-crop-y={selection.y}
                                data-crop-w={selection.w}
                                data-crop-h={selection.h}
                                data-crop-shape={shape}
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
                                                {shape === 'round' ? (
                                                    <ellipse
                                                        cx={(selection.x + selection.w / 2) * scale}
                                                        cy={(selection.y + selection.h / 2) * scale}
                                                        rx={(selection.w / 2) * scale}
                                                        ry={(selection.h / 2) * scale}
                                                        fill="black"
                                                    />
                                                ) : (
                                                    <rect x={selection.x * scale} y={selection.y * scale} width={selection.w * scale} height={selection.h * scale} fill="black" />
                                                )}
                                            </mask>
                                        </defs>
                                        <rect x={0} y={0} width={image.width * scale} height={image.height * scale} fill="rgba(0,0,0,0.45)" mask="url(#logo-crop-mask)" />
                                        {shape === 'round' && (
                                            <ellipse
                                                cx={(selection.x + selection.w / 2) * scale}
                                                cy={(selection.y + selection.h / 2) * scale}
                                                rx={(selection.w / 2) * scale}
                                                ry={(selection.h / 2) * scale}
                                                fill="none" stroke="#fff" strokeWidth={2}
                                            />
                                        )}
                                        <rect x={selection.x * scale} y={selection.y * scale} width={selection.w * scale} height={selection.h * scale} fill="none" stroke="#fff" strokeWidth={shape === 'round' ? 1 : 2} strokeDasharray={shape === 'round' ? '4 4' : undefined} />
                                        {shape !== 'all' && (
                                            <rect x={(selection.x + selection.w) * scale - 10} y={(selection.y + selection.h) * scale - 10} width={20} height={20} fill="#fff" stroke="#000" strokeWidth={1} />
                                        )}
                                    </svg>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    {image && (
                        <Stack mt={2} spacing={1}>
                            <FormControl>
                                <FormLabel id="crop-shape-label" sx={{ fontSize: 12 }}>Crop shape</FormLabel>
                                <RadioGroup row aria-labelledby="crop-shape-label" value={shape} onChange={e => changeShape(e.target.value as CropShape)}>
                                    {CROP_SHAPES.map(s => (
                                        <FormControlLabel key={s.value} value={s.value} control={<Radio size="small" />} label={s.label} />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                            {locked ? (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="caption">Crop size</Typography>
                                    <Slider min={MIN_CROP} max={Math.min(image.width, image.height)} value={selection.w} onChange={sliderChange} />
                                </Stack>
                            ) : (
                                <Typography variant="caption" color="text.secondary">
                                    {shape === 'all'
                                        ? `Using the whole image (${Math.round(image.width)} x ${Math.round(image.height)})`
                                        : `Drag inside to move, drag the corner handle to resize (${Math.round(selection.w)} x ${Math.round(selection.h)})`}
                                </Typography>
                            )}
                        </Stack>
                    )}
                    <Box id="crop-instructions" sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: -1, border: 0, clip: 'rect(0 0 0 0)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        Use arrow keys to move the crop. Hold Shift + arrow to resize. Hold Alt for bigger steps. Press Apply to confirm.
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={applyCrop} variant="contained" disabled={!image}>Apply</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
