import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

class AvatarService {
  private readonly AVATAR_KEY = '@avatar_image_';
  private readonly MAX_SIZE = 200; // pixels

  /**
   * Sélectionne et sauvegarde un avatar localement
   */
  async selectAndSaveAvatar(userId: string) {
    try {
      // Demander les permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder à vos photos pour changer votre avatar.'
        );
        return { success: false, uri: null };
      }

      // Sélectionner l'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) {
        return { success: false, uri: null };
      }

      const image = result.assets[0];

      // Compresser et redimensionner l'image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: this.MAX_SIZE, height: this.MAX_SIZE } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Erreur lors de la conversion de l\'image');
      }

      // Sauvegarder en base64 dans AsyncStorage
      const base64Image = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      await AsyncStorage.setItem(`${this.AVATAR_KEY}${userId}`, base64Image);

      return { success: true, uri: base64Image };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'avatar:', error);
      return { success: false, uri: null };
    }
  }

  /**
   * Récupère l'avatar depuis le localStorage
   */
  async getAvatar(userId: string): Promise<string | null> {
    try {
      const avatar = await AsyncStorage.getItem(`${this.AVATAR_KEY}${userId}`);
      return avatar;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'avatar:', error);
      return null;
    }
  }

  /**
   * Supprime l'avatar du localStorage
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${this.AVATAR_KEY}${userId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      return false;
    }
  }

  /**
   * Prend une photo avec la caméra pour l'avatar
   */
  async takePhotoForAvatar(userId: string) {
    try {
      // Demander les permissions caméra
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder à votre caméra pour prendre une photo.'
        );
        return { success: false, uri: null };
      }

      // Prendre la photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) {
        return { success: false, uri: null };
      }

      const image = result.assets[0];

      // Compresser et redimensionner
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        image.uri,
        [{ resize: { width: this.MAX_SIZE, height: this.MAX_SIZE } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Erreur lors de la conversion de l\'image');
      }

      // Sauvegarder
      const base64Image = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      await AsyncStorage.setItem(`${this.AVATAR_KEY}${userId}`, base64Image);

      return { success: true, uri: base64Image };
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      return { success: false, uri: null };
    }
  }

  /**
   * Obtient la taille estimée de l'avatar en KB
   */
  async getAvatarSize(userId: string): Promise<number> {
    try {
      const avatar = await AsyncStorage.getItem(`${this.AVATAR_KEY}${userId}`);
      if (!avatar) return 0;
      
      // Estimation : base64 augmente la taille de ~33%
      const sizeInBytes = avatar.length * 0.75;
      const sizeInKB = sizeInBytes / 1024;
      return Math.round(sizeInKB);
    } catch (error) {
      return 0;
    }
  }
}

export const avatarService = new AvatarService();