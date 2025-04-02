import React from 'react'
import { Platform, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import WebView from 'react-native-webview'

type RouteParams = {
  url: string
}

export default function WebViewComp() {
  const { url } = useLocalSearchParams<RouteParams>()

  return (
    <View style={{ flex: 1 }}>
      {url && (
        <>
          <WebView
            source={{
              uri: url,
            }}
            className={Platform.OS === 'ios' ? 'opacity-100' : 'opacity-99 min-h-[1px]'}
            originWhitelist={['*']}
            startInLoadingState
          />
        </>
      )}
    </View>
  )
}