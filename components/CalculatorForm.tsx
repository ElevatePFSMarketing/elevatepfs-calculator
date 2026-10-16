
import React from 'react';
import type { FormData, FieldErrors } from '../types';
import { STATES } from '../constants';
import Tooltip from './Tooltip';
import { ArrowUpIcon, SpinnerIcon } from './icons';


interface CalculatorFormProps {
    formData: FormData;
    fieldErrors: FieldErrors;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onRadioChange: (value: 'yes' | 'no') => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    error: string;
}

const InputField: React.FC<{
    id: string;
    label: string;
    tooltip: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: keyof FormData;
    min?: number;
    max?: number;
    error?: string;
}> = ({ id, label, tooltip, error, ...props }) => (
    <div className="relative">
        <label htmlFor={id} className="flex items-center text-sm font-medium text-foundation-700 mb-2">
            {label}
            <Tooltip text={tooltip} />
        </label>
        <input
            type="number"
            id={id}
            required
            className={`w-full px-4 py-3 bg-foundation-50 border-2 rounded-lg transition focus:ring-summit-500 focus:border-summit-500 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-foundation-200'}`}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 font-medium animate-pulse">{error}</p>}
    </div>
);


const CalculatorForm: React.FC<CalculatorFormProps> = ({ formData, fieldErrors, onInputChange, onRadioChange, onSubmit, isLoading, error }) => {

    return (
        <form 
            onSubmit={onSubmit} 
            className="p-6 sm:p-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InputField
                    id="chemoChairs"
                    name="chemoChairs"
                    label="Number of Chemo/Infusion Chairs"
                    tooltip="Total number of chemotherapy and infusion treatment chairs in your facility"
                    value={formData.chemoChairs}
                    onChange={onInputChange}
                    error={fieldErrors.chemoChairs}
                />
                <InputField
                    id="oncologists"
                    name="oncologists"
                    label="Number of Medical Oncologists"
                    tooltip="Total number of medical oncologists on staff"
                    value={formData.oncologists}
                    onChange={onInputChange}
                    error={fieldErrors.oncologists}
                />
                <InputField
                    id="beds"
                    name="beds"
                    label="Number of Beds"
                    tooltip="Total number of licensed beds in your facility"
                    value={formData.beds}
                    onChange={onInputChange}
                    error={fieldErrors.beds}
                />
                <InputField
                    id="edVisits"
                    name="edVisits"
                    label="Annual Emergency Department Visits"
                    tooltip="Total number of emergency department visits per year"
                    value={formData.edVisits}
                    onChange={onInputChange}
                    error={fieldErrors.edVisits}
                />
                <div className="relative md:col-span-1">
                    <label htmlFor="state" className="flex items-center text-sm font-medium text-foundation-700 mb-2">
                        State
                        <Tooltip text="Select your state to determine Medicaid expansion status" />
                    </label>
                    <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={onInputChange}
                        required
                        className={`w-full px-4 py-3 bg-foundation-50 border-2 rounded-lg transition appearance-none focus:ring-summit-500 focus:border-summit-500 ${fieldErrors.state ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-foundation-200'}`}
                    >
                        <option value="">Select your state</option>
                        {STATES.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
                    </select>
                    {fieldErrors.state && <p className="mt-1 text-sm text-red-600 font-medium animate-pulse">{fieldErrors.state}</p>}
                </div>
                <div className="relative md:col-span-1">
                    <label className="flex items-center text-sm font-medium text-foundation-700 mb-2">
                        Is your organization eligible for 340B?
                        <Tooltip text="Eligibility for the 340B Drug Pricing Program" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                type="radio"
                                id="340b-yes"
                                name="is340B"
                                value="yes"
                                checked={formData.is340B === 'yes'}
                                onChange={() => onRadioChange('yes')}
                                className="sr-only peer"
                            />
                            <label htmlFor="340b-yes" className="block w-full text-center py-3 px-4 rounded-lg border-2 border-foundation-200 cursor-pointer peer-checked:bg-summit-700 peer-checked:text-white peer-checked:border-summit-700 font-semibold transition">
                                Yes
                            </label>
                        </div>
                        <div>
                            <input
                                type="radio"
                                id="340b-no"
                                name="is340B"
                                value="no"
                                checked={formData.is340B === 'no'}
                                onChange={() => onRadioChange('no')}
                                className="sr-only peer"
                            />
                            <label htmlFor="340b-no" className="block w-full text-center py-3 px-4 rounded-lg border-2 border-foundation-200 cursor-pointer peer-checked:bg-summit-700 peer-checked:text-white peer-checked:border-summit-700 font-semibold transition">
                                No
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-medium">{error}</div>}
            
            <div className="mt-8">
                 <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-advocacy-500 text-white text-lg font-bold py-4 px-6 rounded-xl hover:bg-advocacy-600 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Calculating...
                        </>
                    ) : (
                        <>
                            Calculate Potential Savings
                            <span className="ml-3 bg-white/20 p-2 rounded-full">
                                <ArrowUpIcon className="h-5 w-5"/>
                            </span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default CalculatorForm;
