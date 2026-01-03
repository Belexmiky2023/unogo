import { motion, AnimatePresence } from "framer-motion";
import { X, Check, User } from "lucide-react";
import { GameInvite } from "@/hooks/useMultiplayer";

interface InviteNotificationProps {
  invites: GameInvite[];
  onAccept: (invite: GameInvite) => void;
  onDecline: (invite: GameInvite) => void;
}

export function InviteNotification({ invites, onAccept, onDecline }: InviteNotificationProps) {
  return (
    <AnimatePresence>
      {invites.map((invite, index) => (
        <motion.div
          key={invite.id}
          initial={{ opacity: 0, x: 300, y: 0 }}
          animate={{ opacity: 1, x: 0, y: index * 90 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-4 right-4 z-50 w-80"
        >
          <div className="glass rounded-xl p-4 border border-uno-yellow/30 shadow-lg shadow-uno-yellow/20">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-uno-red to-uno-blue flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-bold font-nunito text-foreground">
                  Game Invite! 🎮
                </p>
                <p className="text-sm text-muted-foreground font-nunito truncate">
                  @{invite.from_username} wants to play
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onAccept(invite)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-uno-green hover:bg-uno-green/80 text-white rounded-lg font-nunito font-bold transition-colors"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => onDecline(invite)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg font-nunito font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}