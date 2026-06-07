interface ButtonCrudProps {
    onClick?: () => void;
    icon?: React.ReactNode;
    label?: string;
    className?: string;
    disabled?: boolean;
    type?: "submit" | "reset" | "button";
}

export default function ButtonCrud({ onClick, icon, label, className = '', disabled = false, type = "button" }: ButtonCrudProps) {
    return (
        <button type={type} onClick={onClick}
        disabled={disabled}
            className={`py-2 px-2 text-sm sm:py-2.5 sm:px-4 text-white rounded-xl font-semibold transition-all shadow-md shadow-primary-600/10 flex items-center gap-2 ${className}`}>
            {icon}
            {label}
        </button>
    );
}