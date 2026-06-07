interface IconProps {
    size?: number;
}


const CircleCheckIcon = ({size = 24}: IconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-check" height={size} strokeWidth={2} viewBox="0 0 24 24"><path fill="none" stroke="none" d="M0 0h24v24H0z"/><path d="m5 12 5 5L20 7"/></svg>
    );
};

export default CircleCheckIcon;