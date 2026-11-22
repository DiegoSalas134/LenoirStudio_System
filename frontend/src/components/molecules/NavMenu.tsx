import NavItem, { type NavItemData } from "../atoms/NavItem";

type NavMenuProps = {
  items: NavItemData[];
};

export default function NavMenu({ items }: NavMenuProps) {
  return (
    <nav aria-label="Principal">
      <ul className="flex items-center gap-6 sm:gap-12">
        {items.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </ul>
    </nav>
  );
}