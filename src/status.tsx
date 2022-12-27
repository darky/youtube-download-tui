import { Text } from 'ink'
import Spinner from 'ink-spinner'
import * as React from 'react'

import { ns } from 'repl-ns'
import { downloadNS } from 'src/download'
import { useStore } from 'src/useStore'
import { match } from 'ts-pattern'

export const statusNS = ns('status', {
  Status: () => {
    const downloadStatus = useStore(downloadNS().downloadStatus$)

    return (
      <>
        {match(downloadStatus)
          .with({ status: 'in progress' }, () => <Spinner type="aesthetic" />)
          .with({ status: 'completed' }, () => <Text color={'green'}>✅ Video downloaded!</Text>)
          .with({ status: 'error' }, ({ payload }) => <Text color={'red'}>{payload}</Text>)
          .with({ status: 'nothing' }, () => <></>)
          .exhaustive()}
      </>
    )
  },
})
