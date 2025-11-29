import {I18nManager, Platform} from 'react-native';
import {QuranPageLayout, QuranTypesEnums} from './src';
import {IMAGES} from './src/common';

// Local Font Server URL
// - Android Emulator: http://10.0.2.2:3001/fonts/
// - iOS Simulator: http://localhost:3001/fonts/
// - Physical Device: http://<your-computer-ip>:3001/fonts/
const FONTS_URL = Platform.select({
  android: 'http://10.0.2.2:3001/fonts/',
  ios: 'http://localhost:3001/fonts/',
  default: 'http://localhost:3001/fonts/',
});

const App = () => {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);

  return (
    <QuranPageLayout
      chapterId={2}
      type={QuranTypesEnums.chapter}
      QURAN_FONTS_API={FONTS_URL}
      backgroundImage={IMAGES.mushafFrame}
      surahNameFrameImage={IMAGES.surahNameFrame}
      autoCompleteAudioAfterPlayingVerse
      onBookMarkedVerse={verse => {
        console.log(verse);
      }}
    />
  );
};

export default App;
