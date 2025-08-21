import type { FC } from "react";

const Logo: FC<{ className?: string }> = ({ className }) => {
	return (
		<img
			src="/icons/logo.jpg"
			alt="BrowserEye Logo"
			width="64"
			height="64"
			className={className}
			style={{ borderRadius: "8px" }}
		/>
	);
};

export default Logo;
