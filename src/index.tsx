import * as React from 'react'

import { Box, render, Text } from 'ink'
import BigText from 'ink-big-text'
import { ns } from 'repl-ns'
import { Form, FormProps } from 'ink-form'
import Spinner from 'ink-spinner'
import yt from 'ytdl-core-muxer'
import fs from 'fs'
import { atom, SetStateAction, useAtom } from 'jotai'

type State = { url: string; path: string; startTime: string; endTime: string }

const mainNS = ns('main', {
  Main: () => {
    const [url, setUrl] = useAtom(mainNS().url$)
    const [path, setPath] = useAtom(mainNS().path$)
    const [startTime, setStartTime] = useAtom(mainNS().startTime$)
    const [endTime, setEndTime] = useAtom(mainNS().endTime$)
    const [downloaded, setDownloaded] = useAtom(mainNS().downloaded$)
    const [downloadInProgress, setDownloadInProgress] = useAtom(mainNS().downloadInProgress$)
    const [downloadError, setDownloadError] = useAtom(mainNS().downloadError$)

    return (
      <Box flexDirection="column">
        <Box>
          <BigText text="YOUTUBE DOWNLOAD"></BigText>
        </Box>
        <Box marginBottom={1}>
          {downloadInProgress ? (
            <Spinner type="aesthetic" />
          ) : downloaded ? (
            <Text color={'green'}>✅ Video downloaded!</Text>
          ) : downloadError ? (
            <Text color={'red'}>{downloadError.message}</Text>
          ) : null}
        </Box>
        <Box>
          <Form
            {...mainNS().formProps({ url, path, startTime, endTime }, { setUrl, setPath, setStartTime, setEndTime })}
            onSubmit={obj => {
              setDownloaded(() => false)
              setDownloadInProgress(() => true)
              mainNS().onDownload(obj as State, { setDownloaded, setDownloadInProgress, setDownloadError })
            }}
          />
        </Box>
      </Box>
    )
  },

  formProps: (
    { url, path, startTime, endTime }: State,
    {
      setUrl,
      setPath,
      setStartTime,
      setEndTime,
    }: {
      setUrl: (update: SetStateAction<string>) => void
      setPath: (update: SetStateAction<string>) => void
      setStartTime: (update: SetStateAction<string>) => void
      setEndTime: (update: SetStateAction<string>) => void
    }
  ) =>
    ({
      onChange: (state: State) => {
        setUrl(() => state.url)
        setPath(() => state.path)
        setStartTime(() => state.startTime)
        setEndTime(() => state.endTime)
      },
      form: {
        title: 'Please setup form for downloading video from Youtube',
        sections: [
          {
            title: '',
            fields: [
              {
                type: 'string',
                name: 'url',
                label: 'Youtube URL',
                regex: RegExp('^https://.*$'),
                initialValue: url,
              },
              {
                type: 'string',
                name: 'path',
                label: 'File location',
                initialValue: path || `${process.cwd()}/video.mp4`,
              },
              {
                type: 'string',
                name: 'startTime',
                label: 'Start time (optional)',
                regex: RegExp('^\\d\\d:\\d\\d:\\d\\d$'),
                initialValue: startTime,
              },
              {
                type: 'string',
                name: 'endTime',
                label: 'End time (optional)',
                regex: RegExp('^\\d\\d:\\d\\d:\\d\\d$'),
                initialValue: endTime,
              },
            ],
          },
        ],
      },
    } as FormProps),

  onDownload(
    obj: State,
    {
      setDownloaded,
      setDownloadInProgress,
      setDownloadError,
    }: {
      setDownloaded: (update: SetStateAction<boolean>) => void
      setDownloadInProgress: (update: SetStateAction<boolean>) => void
      setDownloadError: (update: SetStateAction<Error | null>) => void
    }
  ) {
    yt(obj.url, {
      ffmpeg: ([] as string[])
        .concat(obj.startTime ? ['-ss', obj.startTime, '-ss', obj.startTime] : [])
        .concat(obj.endTime ? ['-to', obj.endTime, '-to', obj.endTime] : []),
    })
      .on('error', err => {
        setDownloadInProgress(() => false)
        setDownloaded(() => false)
        setDownloadError(() => err)
      })
      .pipe(fs.createWriteStream(obj.path))
      .on('finish', () => {
        setDownloadInProgress(() => false)
        setDownloaded(() => true)
        setDownloadError(() => null)
      })
  },

  url$: atom(''),

  path$: atom(''),

  startTime$: atom(''),

  endTime$: atom(''),

  downloaded$: atom(false),

  downloadInProgress$: atom(false),

  downloadError$: atom<Error | null>(null),
})

;(async () => {
  await mainNS.ready

  const Main = mainNS().Main
  render(<Main />)
})()
