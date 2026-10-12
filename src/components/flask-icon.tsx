import Image from "next/image";

export function FlaskIcon() {
  return (
    <span className="header-flask" aria-hidden="true">
      <Image
        src="/brand/flask-logo.png"
        alt=""
        width={1484}
        height={1920}
        sizes="52px"
        priority
      />
    </span>
  );
}
