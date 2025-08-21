import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { SessionStats } from '../hooks/useSessionAnalytics';

export class ExportService {
  /**
   * Génère et partage un PDF du rapport de session
   */
  static async exportSessionPDF(stats: SessionStats, userName?: string): Promise<void> {
    try {
      const html = this.generateHTMLReport(stats, userName);

      // Générer le PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager le rapport de session',
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error("Le partage n'est pas disponible sur cet appareil");
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      throw error;
    }
  }

  /**
   * Génère le HTML pour le rapport PDF
   */
  private static generateHTMLReport(stats: SessionStats, userName?: string): string {
    const date = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const gradeColor = this.getGradeColor(stats.successRate);
    const gradeLabel = this.getGradeLabel(stats.successRate);

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Session - CasqueEnMain</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #DC2626;
          }

          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #DC2626;
            margin-bottom: 10px;
          }

          .subtitle {
            font-size: 18px;
            color: #666;
          }

          .date {
            font-size: 14px;
            color: #999;
            margin-top: 10px;
          }

          .score-section {
            background: linear-gradient(135deg, ${gradeColor} 0%, ${gradeColor}88 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .score-title {
            font-size: 24px;
            margin-bottom: 20px;
          }

          .score-main {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
          }

          .score-percentage {
            font-size: 36px;
            opacity: 0.95;
          }

          .score-note {
            font-size: 20px;
            margin-top: 15px;
            opacity: 0.9;
          }

          .grade-label {
            font-size: 18px;
            font-style: italic;
            margin-top: 10px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }

          .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #e9ecef;
          }

          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }

          .stat-label {
            font-size: 14px;
            color: #666;
          }

          .themes-section {
            margin-bottom: 40px;
          }

          .section-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
          }

          .theme-item {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
          }

          .theme-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .theme-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }

          .theme-score {
            font-size: 16px;
            font-weight: bold;
            color: #666;
          }

          .theme-progress {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
          }

          .theme-progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }

          .theme-percentage {
            font-size: 14px;
            color: #666;
            text-align: right;
          }

          .sous-themes {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
          }

          .sous-theme-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            color: #666;
          }

          .failed-questions {
            margin-bottom: 40px;
          }

          .question-card {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
          }

          .question-text {
            font-size: 16px;
            color: #333;
            margin-bottom: 15px;
            line-height: 1.5;
          }

          .answer-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }

          .answer-box {
            padding: 10px;
            border-radius: 8px;
          }

          .wrong-answer {
            background: #fef2f2;
            border: 1px solid #fca5a5;
          }

          .correct-answer {
            background: #f0fdf4;
            border: 1px solid #86efac;
          }

          .answer-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 600;
          }

          .answer-text {
            font-size: 14px;
            color: #333;
          }

          .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e9ecef;
            color: #666;
            font-size: 14px;
          }

          .footer-logo {
            font-size: 18px;
            font-weight: bold;
            color: #DC2626;
            margin-bottom: 10px;
          }

          .page-break {
            page-break-after: always;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚒 CasqueEnMain</div>
            <div class="subtitle">Rapport de Session d'Entraînement</div>
            ${userName ? `<div class="subtitle">Utilisateur: ${userName}</div>` : ''}
            <div class="date">${date}</div>
          </div>

          <div class="score-section">
            <div class="score-title">Score Final</div>
            <div class="score-main">${stats.correctAnswers}/${stats.totalQuestions}</div>
            <div class="score-percentage">${stats.successRate.toFixed(0)}%</div>
            <div class="score-note">Note: ${((stats.successRate * 20) / 100).toFixed(1)}/20</div>
            <div class="grade-label">${gradeLabel}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.correctAnswers}</div>
              <div class="stat-label">Réponses correctes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalTime ? this.formatTime(stats.totalTime) : '--:--'}</div>
              <div class="stat-label">Temps total</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">+${stats.pointsEarned}</div>
              <div class="stat-label">Points gagnés</div>
            </div>
          </div>

          <div class="themes-section">
            <h2 class="section-title">Performance par thème</h2>
            ${stats.themeStats
              .map(
                theme => `
              <div class="theme-item">
                <div class="theme-header">
                  <div class="theme-name">${theme.themeName}</div>
                  <div class="theme-score">${theme.correctAnswers}/${theme.totalQuestions}</div>
                </div>
                <div class="theme-progress">
                  <div class="theme-progress-fill" style="width: ${theme.successRate}%; background: ${theme.themeColor};"></div>
                </div>
                <div class="theme-percentage">${theme.successRate.toFixed(0)}% de réussite</div>
                
                ${
                  theme.sousThemes.length > 0
                    ? `
                  <div class="sous-themes">
                    ${theme.sousThemes
                      .map(
                        st => `
                      <div class="sous-theme-item">
                        <span>• ${st.sousThemeName}</span>
                        <span>${st.correctAnswers}/${st.totalQuestions} (${st.successRate.toFixed(0)}%)</span>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>

          ${
            stats.failedQuestions.length > 0
              ? `
            <div class="failed-questions page-break">
              <h2 class="section-title">Questions à revoir (${stats.failedQuestions.length})</h2>
              ${stats.failedQuestions
                .slice(0, 10)
                .map(
                  q => `
                <div class="question-card">
                  <div class="question-text">${q.enonce}</div>
                  <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
                    ${q.themeName} ${q.sousThemeName ? `• ${q.sousThemeName}` : ''}
                  </div>
                  <div class="answer-comparison">
                    <div class="answer-box wrong-answer">
                      <div class="answer-label">Votre réponse:</div>
                      <div class="answer-text">${q.userAnswer ?? 'Pas de réponse'}</div>
                    </div>
                    <div class="answer-box correct-answer">
                      <div class="answer-label">Bonne réponse:</div>
                      <div class="answer-text">${q.correctAnswer}</div>
                    </div>
                  </div>
                  ${
                    q.explication
                      ? `
                    <div style="margin-top: 15px; padding: 10px; background: #f0f9ff; border-radius: 8px;">
                      <div style="font-size: 14px; font-weight: 600; color: #0369a1; margin-bottom: 5px;">Explication:</div>
                      <div style="font-size: 14px; color: #333; line-height: 1.5;">${q.explication}</div>
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                )
                .join('')}
              ${
                stats.failedQuestions.length > 10
                  ? `
                <div style="text-align: center; margin-top: 20px; font-style: italic; color: #666;">
                  ... et ${stats.failedQuestions.length - 10} autres questions
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }

          <div class="footer">
            <div class="footer-logo">CasqueEnMain</div>
            <div>Formation continue des sapeurs-pompiers</div>
            <div style="margin-top: 10px;">© 2025 CasqueEnMain - Tous droits réservés</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Export des données au format CSV
   */
  static async exportSessionCSV(stats: SessionStats): Promise<void> {
    try {
      const csv = this.generateCSV(stats);
      const fileName = `session_${stats.sessionId}_${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Partager les données de session',
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      throw error;
    }
  }

  /**
   * Génère le contenu CSV
   */
  private static generateCSV(stats: SessionStats): string {
    const headers = [
      'Session ID',
      'Score',
      'Questions Total',
      'Réponses Correctes',
      'Taux de Réussite (%)',
      'Temps Total (s)',
      'Temps Moyen (s)',
      'Points Gagnés',
    ];

    const mainData = [
      stats.sessionId,
      stats.score,
      stats.totalQuestions,
      stats.correctAnswers,
      stats.successRate.toFixed(2),
      stats.totalTime ?? 'N/A',
      stats.averageTime?.toFixed(2) ?? 'N/A',
      stats.pointsEarned,
    ];

    let csv = headers.join(',') + '\n';
    csv += mainData.join(',') + '\n\n';

    // Détails par thème
    csv += 'Thème,Questions,Correctes,Taux (%),Points\n';
    stats.themeStats.forEach(theme => {
      csv += `"${theme.themeName}",${theme.totalQuestions},${theme.correctAnswers},${theme.successRate.toFixed(2)},${theme.points}\n`;
    });

    return csv;
  }

  /**
   * Export des données au format JSON
   */
  static async exportSessionJSON(stats: SessionStats): Promise<void> {
    try {
      const json = JSON.stringify(stats, null, 2);
      const fileName = `session_${stats.sessionId}_${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Partager les données de session',
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'export JSON:", error);
      throw error;
    }
  }

  // Utilitaires
  private static getGradeColor(rate: number): string {
    if (rate >= 90) {
      return '#FFD700';
    }
    if (rate >= 80) {
      return '#10B981';
    }
    if (rate >= 70) {
      return '#3B82F6';
    }
    if (rate >= 60) {
      return '#F59E0B';
    }
    return '#EF4444';
  }

  private static getGradeLabel(rate: number): string {
    if (rate >= 90) {
      return 'Excellent - Maîtrise exceptionnelle';
    }
    if (rate >= 80) {
      return 'Très bien - Très bon niveau';
    }
    if (rate >= 70) {
      return 'Bien - Bon niveau';
    }
    if (rate >= 60) {
      return 'Assez bien - En progression';
    }
    return 'À améliorer - Continuez vos efforts';
  }

  private static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
