import React, { createContext, useContext, useState, useEffect } from 'react';
import BASE_URL from '../config/api';

const SiteSettingsContext = createContext({ settings: {}, updateSettings: () => {} });

export const SiteSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({ show_pants: false });
    const [loading, setLoading] = useState(true);

    const fetchSettings = () => {
        fetch(`/api/settings/public`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (key, value, token) => {
        try {
            const res = await fetch(`/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer `
                },
                body: JSON.stringify({ key, value })
            });
            const data = await res.json();
            if (data.success) {
                setSettings(prev => ({ ...prev, [key]: value }));
            }
            return data.success;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return (
        <SiteSettingsContext.Provider value={{ settings, loading, updateSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);