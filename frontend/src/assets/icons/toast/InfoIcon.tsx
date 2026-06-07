interface IconProps {
    size?: number;
}

const InfoIcon = ({size = 24}: IconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-info-square-rounded" height={size} strokeWidth={2} width={size} viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z"/><path d="M12 9h.01M11 12h1v4h1"/><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"/></svg>
    );
};

export default InfoIcon;