import * as chakra from '@chakra-ui/react';
import * as icons from '@chakra-ui/icons';
import dynamic from 'next/dynamic';
import { DeepClient, useDeep, useDeepSubscription } from "@deep-foundation/deeplinks/imports/client";
import { evalClientHandler as deepclientEvalClientHandler } from '@deep-foundation/deeplinks/imports/client-handler';
import { Id, useMinilinksFilter, useMinilinksSubscription } from "@deep-foundation/deeplinks/imports/minilinks";
import axios from 'axios';
import * as axiosHooks from 'axios-hooks';
import * as classnames from 'classnames';
import React, { useCallback, useEffect, useRef, PropsWithChildren, useState } from 'react';
// import * as reacticons from 'react-icons';
import * as motion from 'framer-motion';
import Linkify from 'react-linkify';
import * as reactHotkeysHook from 'react-hotkeys-hook';
import * as debounce from '@react-hook/debounce';
import * as json5 from 'json5';
import * as bs from 'react-icons/bs';
import * as fi from 'react-icons/fi';
import * as tb from 'react-icons/tb';
import * as ci from 'react-icons/ci';
import { IconContext } from 'react-icons';
import * as editor from 'slate';
import * as slate from 'slate-react';
import SoftBreak from 'slate-soft-break';
import { slateToHtml, htmlToSlate } from 'slate-serializers';
import isHotkey from 'is-hotkey';
import * as Resizable from 're-resizable';
import { useContainer, useSpaceId, useRefAutofill, useFocusMethods, useShowExtra, useBreadcrumbs, useTraveler } from './hooks';
import { CytoEditorPreview } from './cyto/editor-preview';
import { CustomizableIcon } from './icons-provider';
import { useChackraColor, useChackraGlobal } from './get-color';
import { EditorTextArea } from './editor/editor-textarea';
import { BubbleArrowLeft } from './svg/bubble-arrow-left';
import { CytoReactLinkAvatar } from './cyto-react-avatar';
import { DeepWysiwyg, BlockButton, MarkButton, useStringSaver } from './deep-wysiwyg';
import { Resize } from './resize';
import * as rjsfCore from '@rjsf/core';
import * as rjsfChakra from '@rjsf/chakra-ui';
import * as rjsfValidator from '@rjsf/validator-ajv8';
// @ts-ignore
// import * as aframeReact from '@belivvr/aframe-react';
// import { Entity, Scene } from 'aframe-react';
import { CatchErrors } from './react-errors';
import _ from 'lodash';
import md5 from "md5";
import { v4 as uuidv4 } from 'uuid';
import * as d3d from 'd3-force-3d';
import * as D3 from 'd3';
import WordCloud from 'react-d3-cloud';
import ReactResizeDetector from 'react-resize-detector';
import queryStore from '@deep-foundation/store/query';
import localStore from '@deep-foundation/store/local';
import * as themeTools from '@chakra-ui/theme-tools';
import * as recharts from 'recharts';
import * as i18n from "i18next";
import * as LanguageDetector from 'i18next-browser-languagedetector';
import * as reacti18next from "react-i18next";
import { packageLog } from '../package-log';
import CytoGraph from './cyto/graph';
import * as reactYandexMaps from '@pbe/react-yandex-maps'
import * as warframeMarketPrimeTrashBuyer from '@likissdmd/warframe-market-prime-trash-buyer'
// import ReactCalendarTimeline from 'react-calendar-timeline'
import moment from 'moment'
import { useEditorTabs } from './cyto/editor';
import { useCytoEditor } from './cyto/hooks';
import * as reactHookForm from 'react-hook-form'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), { ssr: false });

export const ClientHandler = React.memo(function ClientHandler(_props: ClientHandlerProps) {
  const log = packageLog.extend(ClientHandler.name);
  log({_props})
  const {
    linkId,
    handlerId,
    context = [],
    ml,
    onClose,
    fillSize,
    error: outerError,
    ...props
  } = _props;
  const deep = useDeep();
  const _ml = ml || deep?.minilinks;
  const hid = useFindClientHandler(_props);
  log({hid})
  const { data: files } = useDeepSubscription({
    id: hid?.dist_id || 0,
  });
  log({files})
  const file = files?.[0];
  log({file})

  const [{ Component, errored } = {} as any, setState] = React.useState<any>({ Component: undefined, errored: undefined });

  // console.log('ClientHandler root', { linkId, handlerId, context, file, hid, files, Component });
  const lastEvalRef = useRef(0);
  useEffect(() => {
    if (!hid) return;
    const value = file?.value?.value;
    console.log('ClientHandler evalClientHandler', { linkId, handlerId, context, file, value, hid, files });
    if (!value) {
      return;
    }
    const evalId = ++lastEvalRef.current;
    evalClientHandler({ value, deep }).then(({ data, error }) => {
      if (evalId === lastEvalRef.current) {
        console.log('ClientHandler evalClientHandler setState', { file, data, error });
        if (!error) {
          setState(() => ({ Component: data }));
          erroredResetRef?.current && (erroredResetRef?.current(), erroredResetRef.current = undefined);
        }
        else {
          setErrorRef.current && setErrorRef.current(error);
          setState({ Component: undefined, errored: error });
        }
      } else {
        console.log('ClientHandler evalClientHandler outdated', { file, data, error, evalId, 'lastEvalRef.current': lastEvalRef.current });
      }
    });
  }, [file?.value?.value, hid]);

  const erroredResetRef = useRef<any>();
  const setErrorRef = useRef<any>();

  return (<>
    <CatchErrors
      error={errored || outerError}
      errorRenderer={(error, reset) => {
        erroredResetRef.current = reset;
        return <div
          style={{
            ...(fillSize ? { width: '100%', height: '100%' } : {
              width: 500, maxHeight: 500
            }),
            overflow: 'scroll',
          }}
        ><chakra.Alert
          style={{
            width: 'max-content',
          }}
          status='error'
          variant='subtle'
          flexDirection='column'
          alignItems='left'
          justifyContent='left'
          textAlign='left'
        >
          <chakra.Button disabled={!Component} width="100%" onClick={reset}>reset</chakra.Button>
          <chakra.AlertIcon />
          <chakra.AlertTitle>{error?.message || (error || '')?.toString()}</chakra.AlertTitle>
          {!!error?.stack && <chakra.AlertDescription>
            <pre>{error?.stack}</pre>
          </chakra.AlertDescription>}
        </chakra.Alert></div>
      }}
      onMounted={(setError) => setErrorRef.current = setError}
      >
      {(typeof (Component) === 'function') ? <>
        {[<ClientHandlerRenderer key={Component.toString()} Component={Component} {...props} fillSize={fillSize} link={_ml.byId[linkId]} ml={_ml} onClose={onClose} />]}
      </> : <></>}
    </CatchErrors>
  </>);
});

DeepClient.resolveDependency = async (path: string) : Promise<any> => {
  if (path == 'peerjs') {
    return await import('peerjs');
  } else if (path == 'emoji-picker-react') {
    return await import('emoji-picker-react');
  } else if (path == 'react-device-detect') {
    return await import('react-device-detect');
  } else if (path == './cyto/hooks') {
    return await import('./cyto/hooks');
  } else if (path == 'react-multi-date-picker') {
    return await import('react-multi-date-picker');
  } else if (path == 'node-sound') {
    return await import('./aframe/components/node-sound');
  } else if (path == 'dragger') {
    return await import('./aframe/components/dragger');
  } else if (path == 'rotator') {
    return await import('./aframe/components/rotator');
  } else if (path == 'scaler') {
    return await import('./aframe/components/scaler');
  } else if (path == 'use-engine-tick') {
    return await import('./aframe/components/tick');
  } else if (path == 'el-movement') {
    return await import('./aframe/components/el-movement');
  } else if (path == 'aframe-extras') {
    return await import('aframe-extras');
  } else if (path == 'aframe') {
    return await import('aframe');
  } else if (path == '@amcharts/amcharts5') {
    return await import('@amcharts/amcharts5');
  } else if (path == '@amcharts/amcharts5/wc') {
    return await import('@amcharts/amcharts5/wc');
  } else {
    return r(path);
  }
};

export const r: any = (path) => {
  if (r.list[path]) return r.list[path];
  throw new Error(`Module not found: Can't resolve ${path}`);
};

// (async () => {
//   localStorage.logs = 0;
//   const { ForceGraph2D, ForceGraph3D, ForceGraphVR, ForceGraphAR } = await import ('react-force-graph');
//   localStorage.debug = localStorage.debug.replace('*:error,*:info,*:warn', '');
//   r.list['react-force-graph'] = {
//     ForceGraph2D,
//     ForceGraph3D,
//     ForceGraphVR,
//     ForceGraphAR
//   }
// })()
r.list = {
  'lodash': _,
  '@chakra-ui/react': chakra,
  'react': React,
  'axios': axios,
  'axios-hooks': axiosHooks,
  'classnames': classnames,
  'slate-soft-break': SoftBreak,
  'slate-serializers': { slateToHtml, htmlToSlate },
  'react-hotkeys-hook': reactHotkeysHook,
  '@react-hook/debounce': debounce,
  'json5': json5,
  'framer-motion': motion,
  'slate': editor,
  'slate-react': slate,
  'is-hotkey': isHotkey,
  're-resizable': Resizable,
  '@monaco-editor/react': MonacoEditor,
  '@chakra-ui/icons': icons,
  '@deep-foundation/deepcase': {
    useContainer,
    useSpaceId,
    useFocusMethods,
    useBreadcrumbs,
    useShowExtra,
    useTraveler,
    CytoEditorPreview,
    CustomizableIcon,
    Resize,
    EditorTextArea,
    ClientHandler,
    BubbleArrowLeft,
    CytoReactLinkAvatar,
    DeepWysiwyg,
    useStringSaver,
    BlockButton,
    MarkButton,
    useRefAutofill,
    useChackraColor,
    useChackraGlobal,
    CytoGraph,
    useEditorTabs,
    useCytoEditor,
  },
  '@deep-foundation/deeplinks': {
    useMinilinksFilter
  },
  'react-icons/bs': bs,
  'react-icons/fi': fi,
  'react-icons/ci': ci,
  'react-icons/tb': tb,
  'react-icons' : IconContext,
  'react-linkify': Linkify,
  '@rjsf/core': rjsfCore,
  '@rjsf/chakra-ui': rjsfChakra,
  '@rjsf/validator-ajv8': rjsfValidator,
  // '@belivvr/aframe-react': aframeReact,
  // 'aframe-react': { Entity, Scene },
  'md5': md5,
  'uuid': uuidv4,
  'd3-force-3d': d3d,
  'd3': D3,
  'react-d3-cloud': WordCloud,
  'react-resize-detector': ReactResizeDetector,
  '@deep-foundation/store/query': queryStore,
  '@deep-foundation/store/local': localStore,
  'recharts': recharts,
  '@chakra-ui/theme-tools': themeTools,
  "i18next": i18n,
  'i18next-browser-languagedetector': LanguageDetector,
  "react-i18next": reacti18next,
  "@pbe/react-yandex-maps": reactYandexMaps,
  "@likissdmd/warframe-market-prime-trash-buyer": warframeMarketPrimeTrashBuyer,
  // "react-calendar-timeline": ReactCalendarTimeline,
  "moment": moment,
  "react-hook-form": reactHookForm
};

export async function evalClientHandler({
  value,
  deep,
  input = {},
}: {
  value: string;
  deep: DeepClient;
  input?: any;
}): Promise<{
  error?: any;
  data?: any;
}> {
  return await deepclientEvalClientHandler({
    value, deep, input: {
      require: r,
      ...input,
    },
  });
}

export interface ClientHandlerRendererProps {
  Component: any;
  fillSize?: boolean;
  onClose?: () => any;
  [key: string]: any;
};

export const ClientHandlerRenderer = React.memo(function ClientHandlerRenderer({
  Component,
  fillSize = false,
  onClose,
  ...props
}: ClientHandlerRendererProps) {
  return <>{typeof (Component) === 'function' && <Component
    onClose={onClose}
    fillSize={fillSize}
    {...props}
    style={{
      ...(fillSize ? { width: '100%', height: '100%' } : {}),
      ...props?.style,
    }}
  />}</>;
});

export interface ClientHandlerProps extends Partial<ClientHandlerRendererProps> {
  linkId: Id;
  handlerId?: Id;
  context?: Id[];
  ml?: any;
  error?: any;
  onClose?: () => any,
}

export function useFindClientHandler({
  linkId,
  handlerId,
  context = [],
  ml,
  onClose,
  fillSize,
  ...props
}: ClientHandlerProps) {
  const deep = useDeep();
  const [hid, setHid] = useState<any>();
  useEffect(() => { (async () => {
    if (hid) return;
    const handler = await deep._findHandler({ context, handlerId });
    if (handler) setHid(handler);
  })(); }, [context, handlerId, hid]);
  return hid;
}
