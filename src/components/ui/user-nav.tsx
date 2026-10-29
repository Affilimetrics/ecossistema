"use client";

import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleUserRound,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

export function UserNav() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none shadow-xs">
          <Avatar className="size-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-semibold text-xs">
              JS
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 font-semibold text-xs">
              JS
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              João Silva
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              joao@scallora.com
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="p-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer gap-2 focus:bg-slate-100 dark:focus:bg-slate-800"
        >
          <CircleUserRound size={16} />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="p-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer gap-2 focus:bg-slate-100 dark:focus:bg-slate-800">
          <CreditCard size={16} />
          <span>Minha Assinatura</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem 
          onClick={() => navigate("/settings")}
          className="p-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer gap-2 focus:bg-slate-100 dark:focus:bg-slate-800"
        >
          <Settings size={16} />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

        <DropdownMenuItem 
          onClick={() => navigate("/")}
          className="p-2 text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer gap-2 focus:bg-red-50 dark:focus:bg-red-950/30"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}