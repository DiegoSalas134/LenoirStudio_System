import NavMenu from "../molecules/NavMenu";

const links = [
  { text: "Inicio", href: "#inicio", isActive: true },
  { text: "Servicios", href: "#servicios" },
  { text: "Reservar", href: "#reservar" },
  { text: "Contacto", href: "#contacto" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-carbon">
      <div className="flex justify-end px-8 py-6">
        <NavMenu items={links} />
      </div>
    </header>
  );
}