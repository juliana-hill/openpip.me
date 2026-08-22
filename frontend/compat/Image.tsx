import type { ImgHTMLAttributes } from "react";

export default function Image(props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) {
  const { fill: _fill, priority: _priority, ...imgProps } = props;
  return <img {...imgProps} />;
}
