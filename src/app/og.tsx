import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The picture a link shows when it's sent in a chat or posted. It's drawn
// outside the page, so it can't use the CSS variables: these are the same
// colors as globals.css, and the same frame, radius and shadow, a little
// bigger for a 1200px picture.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const color = {
	page: "#ff90bc",
	surface: "#ffde90",
	accent: "#8acdd7",
	ink: "#000000",
};

const asset = (name: string) => readFile(join(process.cwd(), "assets", name));

export const linkImage = async ({
	title,
	code,
	line,
}: {
	title: string;
	// a studio's code, shown big so it can be typed in on the home page too
	code?: string;
	line: string;
}) => {
	const [regular, bold, logo] = await Promise.all([
		asset("space-grotesk-latin-400-normal.woff"),
		asset("space-grotesk-latin-700-normal.woff"),
		asset("logo.png"),
	]);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: color.page,
					fontFamily: "Space Grotesk",
					color: color.ink,
				}}
			>
				<div
					style={{
						width: 1040,
						height: 470,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: "48px 56px",
						background: color.accent,
						border: `10px solid ${color.ink}`,
						borderRadius: 16,
						boxShadow: `12px 12px 0 0 ${color.ink}`,
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						alt=""
						src={`data:image/png;base64,${logo.toString("base64")}`}
						width={360}
						height={92}
					/>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						<div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1 }}>
							{title}
						</div>
						<div style={{ fontSize: 34 }}>{line}</div>
					</div>
					{code ? (
						<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
							<div style={{ fontSize: 30, fontWeight: 700 }}>STUDIO CODE</div>
							<div
								style={{
									display: "flex",
									padding: "4px 24px",
									background: color.surface,
									border: `6px solid ${color.ink}`,
									borderRadius: 16,
									fontSize: 52,
									fontWeight: 700,
									letterSpacing: 6,
								}}
							>
								{code}
							</div>
						</div>
					) : (
						<div style={{ display: "flex" }} />
					)}
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{ name: "Space Grotesk", data: regular, weight: 400, style: "normal" },
				{ name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
			],
		}
	);
};
