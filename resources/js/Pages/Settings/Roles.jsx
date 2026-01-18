import React from 'react';
import SettingsLayout from './SettingsLayout';
import { ShieldAlert } from 'lucide-react';

const Roles = () => {
    return (
        <SettingsLayout title="Roles & Permissions">
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Coming Soon</h3>
                <p className="text-gray-500 max-w-md mt-2">
                    Role management and permission controls will be available in a future update.
                </p>
            </div>
        </SettingsLayout>
    );
};

export default Roles;
