'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { label: 'Início', href: '#top' },
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Planos', href: '#planos' },
    { label: 'Sobre', href: '#sobre' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full border-b border-transparent transition-all md:top-4 md:left-1/2 md:-translate-x-1/2 md:max-w-5xl md:rounded-xl md:border',
        {
          'bg-slate-950/80 backdrop-blur-lg border-slate-800 shadow-lg': scrolled && !open,
          'bg-slate-950/95 border-slate-800': open,
        }
      )}
    >
      <nav className="flex h-14 w-full items-center justify-between px-4 md:h-12">
        <a href="#top" className="flex items-center gap-2">
          <div className="grid size-8 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <svg width="16" height="auto" viewBox="0 0 50 39" fill="none" className="fill-white">
              <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
              <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Scallora</span>
        </a>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link, i) => (
            <a key={i} className={buttonVariants({ variant: 'ghost', className: 'text-slate-300 hover:text-white' })} href={link.href}>
              {link.label}
            </a>
          ))}
          <Link to="/" className={buttonVariants({ variant: 'outline', className: 'border-slate-700 bg-transparent text-white hover:bg-slate-800' })}>
            Entrar
          </Link>
          <Link to="/sign-up" className={buttonVariants({ className: 'bg-blue-600 hover:bg-blue-500 text-white' })}>
            Criar Conta
          </Link>
        </div>

        <Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="md:hidden text-white">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
      <div className={cn('fixed inset-0 top-14 z-50 bg-slate-950/98 backdrop-blur-md md:hidden', open ? 'flex' : 'hidden flex-col')}>
        <div className="flex h-full flex-col justify-between p-6">
          <div className="grid gap-4">
            {links.map((link) => (
              <a key={link.label} onClick={() => setOpen(false)} className={buttonVariants({ variant: 'ghost', className: 'justify-start text-lg text-slate-300' })} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setOpen(false)} className={buttonVariants({ variant: 'outline', className: 'w-full border-slate-700 text-white' })}>
              Entrar
            </Link>
            <Link to="/sign-up" onClick={() => setOpen(false)} className={buttonVariants({ className: 'w-full bg-blue-600 text-white' })}>
              Criar Conta
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}