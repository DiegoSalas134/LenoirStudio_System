export type NavItemData = {
  text: string;
  href: string;
  isActive?: boolean;
};

export default function NavItem({ text, href, isActive = false }: NavItemData) {
  return (
    <li>
      <a
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`border-b pb-1 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:text-white ${
          isActive ? "border-white text-white" : "border-transparent text-pebble"
        }`}
      >
        {text}
      </a>
    </li>
  );
}