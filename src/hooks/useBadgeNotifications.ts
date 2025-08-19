import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { badgesService } from '../services/badgesService';

interface BadgeNotification {
  nom: string;
  description: string;
  icone: string;
  couleur: string;
  points?: number;
}

export const useBadgeNotifications = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState<BadgeNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [queue, setQueue] = useState<BadgeNotification[]>([]);

  // Vérifier les nouveaux badges après chaque session
  const checkForNewBadges = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const result = await badgesService.checkAndAwardBadges(user.id);

      if (result.new_badges && result.new_badges.length > 0) {
        // Récupérer les détails des nouveaux badges
        const allBadges = await badgesService.getUserBadges(user.id);
        const newBadgeDetails = result.new_badges
          .map(badgeName => {
            const badge = allBadges.find(b => b.nom === badgeName);
            if (badge) {
              return {
                nom: badge.nom,
                description: badge.description,
                icone: badge.icone,
                couleur: badge.couleur,
                points: badge.points_requis,
              };
            }
            return null;
          })
          .filter(Boolean) as BadgeNotification[];

        // Ajouter à la queue
        setQueue(prev => [...prev, ...newBadgeDetails]);
      }
    } catch (error) {
      console.error('Error checking for new badges:', error);
    }
  }, [user]);

  // Traiter la queue de notifications
  useEffect(() => {
    if (queue.length > 0 && !isVisible) {
      const [first, ...rest] = queue;
      setNotification(first);
      setIsVisible(true);
      setQueue(rest);
    }
  }, [queue, isVisible]);

  // Fermer la notification
  const closeNotification = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  }, []);

  // Afficher une notification manuelle
  const showBadgeNotification = useCallback((badge: BadgeNotification) => {
    setQueue(prev => [...prev, badge]);
  }, []);

  return {
    notification,
    isVisible,
    closeNotification,
    checkForNewBadges,
    showBadgeNotification,
  };
};
