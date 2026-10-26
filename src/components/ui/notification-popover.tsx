import React, { useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationPopoverProps {
  notifications?: Notification[];
  onNotificationsChange?: (notifications: Notification[]) => void;
  isDark?: boolean;
}

const dummyNotifications: Notification[] = [
  {
    id: "1",
    title: "Nova comissão registrada",
    description: "Você recebeu R$ 42,50 de comissão na Shopee.",
    timestamp: new Date(),
    read: false,
  },
  {
    id: "2",
    title: "Sincronização concluída",
    description: "Os produtos do Mercado Livre foram atualizados com sucesso.",
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: "3",
    title: "Alerta de link",
    description: "1 produto da Amazon está pendente de link de afiliado.",
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
];

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications: initialNotifications = dummyNotifications,
  onNotificationsChange,
  isDark,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    onNotificationsChange?.(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    onNotificationsChange?.(updated);
  };

  return (
    <div className="relative">
      {/* Botão do Ícone de Sino */}
      <button
        onClick={toggleOpen}
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-xs focus:outline-none"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-white dark:border-gray-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover flutuante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl z-50 text-gray-900 dark:text-gray-100"
          >
            {/* Cabeçalho do Popover */}
            <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Marcar lidas
                </button>
              )}
            </div>

            {/* Lista de Notificações */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  Nenhuma notificação no momento.
                </div>
              ) : (
                notifications.map((n, index) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      !n.read ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <h4 className="text-xs font-semibold truncate text-gray-900 dark:text-gray-100">
                          {n.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {n.timestamp.toLocaleDateString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      {n.description}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};