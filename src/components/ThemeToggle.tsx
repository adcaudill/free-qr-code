import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

interface Props { mode: 'light' | 'dark'; onToggle: () => void; }

export const ThemeToggle: React.FC<Props> = ({ mode, onToggle }) => (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        <IconButton onClick={onToggle} aria-label="toggle dark mode" color="inherit" size="small" sx={{ ml: 1 }}>
            {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        </IconButton>
    </Tooltip>
);
