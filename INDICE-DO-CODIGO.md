# High OS · Índice do código

Gerado por `node tools/mapa-do-codigo.mjs --md`. Não edite à mão.

810 funções, 37 categorias.

Para ver o impacto de remover uma função:

```
node tools/mapa-do-codigo.mjs nomeDaFuncao
```


## Administração

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `syncForm` | assets/mission-planner.js:1421 | 22 | 2 | 3 |
| `syncMapRegion` | assets/mission-planner.js:1635 | 11 | 1 | 2 |
| `syncMissionsFromCloud` | assets/mission-planner.js:871 | 16 | 2 | 7 |
| `syncSegmentSelects` | assets/app.js:260 | 13 | 5 | 4 |

## ADMINISTRAÇÃO MESTRE DE GROUPS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `adminGroupStatus` | assets/app.js:11168 | 1 | 2 | 0 |
| `renameAdminGroup` | assets/app.js:11197 | 48 | 1 | 12 |
| `renderAdminGroupManager` | assets/app.js:11169 | 28 | 3 | 8 |

## ADMINISTRAÇÃO ORGANIZADA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `normalizeOccupationStatusV820` | assets/app.js:11266 | 31 | 1 | 9 |
| `openAdminTab` | assets/app.js:11249 | 4 | 1 | 4 |

## Alvesinho

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alvesNorm` | assets/modules/metricas-parser.js:25 | 3 | 32 | 0 |

## ALVESINHO OPERACIONAL

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alvesAddMessage` | assets/app.js:4995 | 10 | 1 | 2 |
| `alvesAnswer` | assets/app.js:4894 | 101 | 2 | 12 |
| `alvesDateFromDelivery` | assets/app.js:4893 | 1 | 1 | 0 |
| `alvesFindGroup` | assets/app.js:4861 | 5 | 2 | 2 |
| `alvesFindOrg` | assets/app.js:4866 | 10 | 2 | 2 |
| `alvesInstalledLines` | assets/app.js:4876 | 16 | 1 | 4 |
| `alvesLastHistory` | assets/app.js:4892 | 1 | 1 | 1 |
| `askAlvesinho` | assets/app.js:5005 | 4 | 1 | 2 |

## Autenticação e sessão

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `closeCurrentSession` | assets/app.js:1128 | 32 | 1 | 4 |
| `esperar` | assets/app.js:1112 | 1 | 2 | 0 |
| `login` | assets/app.js:1095 | 1 | 3 | 0 |
| `logout` | assets/app.js:1160 | 2 | 3 | 2 |
| `makeSessionId` | assets/app.js:1126 | 1 | 1 | 1 |
| `renderSessionClock` | assets/app.js:1218 | 21 | 3 | 5 |
| `reservarSessao` | assets/app.js:1114 | 12 | 1 | 3 |
| `sessionStorageKey` | assets/app.js:1098 | 1 | 3 | 0 |
| `startOrResumeSession` | assets/app.js:1162 | 56 | 1 | 8 |
| `startSessionClock` | assets/app.js:1239 | 3 | 1 | 1 |
| `touchSession` | assets/app.js:1245 | 10 | 1 | 1 |

## BOLETIM SEMANAL AUTOMATICO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `boletimAgregar` | assets/app.js:6309 | 17 | 1 | 4 |
| `boletimCalcular` | assets/app.js:6347 | 21 | 1 | 3 |
| `boletimDataBR` | assets/app.js:6296 | 3 | 1 | 1 |
| `boletimJanelas` | assets/app.js:6328 | 8 | 1 | 0 |
| `boletimParseData` | assets/app.js:6299 | 4 | 1 | 1 |
| `boletimPartes` | assets/app.js:6425 | 12 | 1 | 1 |
| `boletimPct` | assets/app.js:6341 | 5 | 1 | 1 |
| `boletimTexto` | assets/app.js:6369 | 54 | 1 | 4 |
| `boletimTotalLinha` | assets/app.js:6303 | 4 | 1 | 1 |
| `boletimVariacao` | assets/app.js:6337 | 4 | 1 | 0 |
| `iso` | assets/app.js:6804 | 1 | 3 | 1 |
| `loadMetricSourceConfig` | assets/app.js:6836 | 7 | 1 | 1 |
| `metricAdvancedStats` | assets/app.js:6573 | 40 | 4 | 6 |
| `movement` | assets/app.js:6533 | 1 | 1 | 2 |
| `openMetricSource` | assets/app.js:6812 | 14 | 1 | 1 |
| `parseMetricImport` | assets/app.js:6729 | 47 | 1 | 5 |
| `renderBoletim` | assets/app.js:6438 | 36 | 1 | 6 |
| `renderMetricAdvancedRanking` | assets/app.js:6613 | 25 | 3 | 7 |
| `renderMetricComparison` | assets/app.js:6645 | 33 | 3 | 5 |
| `renderMetrics` | assets/app.js:6475 | 98 | 6 | 26 |
| `renderRhFactionInsights` | assets/app.js:6678 | 8 | 1 | 3 |
| `saveMetricImport` | assets/app.js:6776 | 21 | 1 | 9 |
| `split` | assets/app.js:6733 | 1 | 1 | 0 |
| `switchMetricCenterView` | assets/app.js:6693 | 11 | 3 | 8 |
| `syncMetricCompareSelectors` | assets/app.js:6638 | 7 | 2 | 3 |
| `testMetricSource` | assets/app.js:6826 | 7 | 1 | 2 |

## BUSCA GLOBAL (Ctrl+K)

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `buscaAbrir` | assets/app.js:3828 | 8 | 1 | 2 |
| `buscaCasa` | assets/app.js:3767 | 4 | 1 | 1 |
| `buscaDestacar` | assets/app.js:3771 | 11 | 1 | 2 |
| `buscaFechar` | assets/app.js:3824 | 4 | 3 | 0 |
| `buscaMontar` | assets/app.js:3866 | 25 | 1 | 2 |
| `buscaNorm` | assets/app.js:3766 | 1 | 3 | 1 |
| `buscaRenderizar` | assets/app.js:3836 | 29 | 2 | 6 |
| `buscaResultados` | assets/app.js:3783 | 40 | 1 | 9 |
| `loadUserAudit` | assets/app.js:3935 | 5 | 4 | 8 |
| `openAuditSession` | assets/app.js:3950 | 1 | 1 | 12 |
| `openUserActivity` | assets/app.js:3954 | 1 | 1 | 4 |
| `renderSaudeSistema` | assets/app.js:3897 | 37 | 1 | 8 |
| `renderUserAudit` | assets/app.js:3940 | 10 | 3 | 11 |

## CAMADA DE RESILIENCIA DO FIRESTORE

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `add` | assets/app.js:2054 | 3 | 11 | 0 |
| `addDoc` | assets/app.js:1612 | 1 | 37 | 0 |
| `autoDeliveryRequests` | assets/app.js:2118 | 128 | 4 | 7 |
| `benefitLines` | assets/app.js:1986 | 35 | 1 | 2 |
| `buildDeliveryExtract` | assets/app.js:2021 | 22 | 2 | 2 |
| `cacheEscrever` | assets/app.js:1704 | 11 | 1 | 1 |
| `cacheLer` | assets/app.js:1715 | 15 | 1 | 1 |
| `changedBenefit` | assets/app.js:2043 | 1 | 1 | 0 |
| `closeRecollectModal` | assets/app.js:2484 | 2 | 1 | 1 |
| `comoSnapshot` | assets/app.js:1730 | 12 | 1 | 0 |
| `compressRecollectImage` | assets/app.js:2486 | 14 | 1 | 1 |
| `copyDeliveryExtract` | assets/app.js:2260 | 7 | 1 | 1 |
| `copyDeliveryRequests` | assets/app.js:2252 | 8 | 1 | 2 |
| `currentFactionFromForm` | assets/app.js:1961 | 25 | 3 | 4 |
| `currentPtBrDateTime` | assets/app.js:2437 | 10 | 1 | 1 |
| `deleteDoc` | assets/app.js:1613 | 1 | 3 | 0 |
| `entrarModoLocal` | assets/app.js:1747 | 13 | 1 | 1 |
| `getDocsCached` | assets/app.js:1789 | 1 | 10 | 0 |
| `getFormBenefits` | assets/app.js:1856 | 64 | 3 | 1 |
| `mostrarFaixaModoLocal` | assets/app.js:1773 | 14 | 1 | 0 |
| `og` | assets/app.js:2051 | 2 | 1 | 0 |
| `openFac` | assets/app.js:2286 | 32 | 5 | 11 |
| `openRecollectModal` | assets/app.js:2467 | 17 | 1 | 5 |
| `operationalRequestAdditions` | assets/app.js:2045 | 1 | 1 | 0 |
| `packCache` | assets/app.js:1672 | 13 | 1 | 0 |
| `recollectExtract` | assets/app.js:2447 | 17 | 2 | 3 |
| `recollectReasonLabel` | assets/app.js:2430 | 7 | 4 | 1 |
| `renderDeliveryRequests` | assets/app.js:2246 | 4 | 1 | 3 |
| `resolveGroupIdentity` | assets/app.js:2268 | 1 | 3 | 0 |
| `sairModoLocal` | assets/app.js:1760 | 13 | 1 | 1 |
| `samePlain` | assets/app.js:2044 | 1 | 2 | 1 |
| `selectedDefaultBenefits` | assets/app.js:1960 | 1 | 2 | 0 |
| `setDoc` | assets/app.js:1611 | 1 | 39 | 0 |
| `setFormBenefits` | assets/app.js:1920 | 1 | 1 | 0 |
| `setRecollectPrint` | assets/app.js:2500 | 6 | 1 | 3 |
| `snapshot` | assets/app.js:2590 | 4 | 4 | 0 |
| `statBump` | assets/app.js:1637 | 13 | 3 | 0 |
| `unpackCache` | assets/app.js:1685 | 19 | 1 | 0 |
| `updateDeliveryPreview` | assets/app.js:2250 | 2 | 6 | 3 |
| `updateRecollectUi` | assets/app.js:2464 | 3 | 3 | 2 |
| `writeBatch` | assets/app.js:1615 | 10 | 10 | 2 |

## CAMADA DO GOOGLE SHEETS RESTAURADA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `authorizeSheets` | assets/app.js:6864 | 20 | 1 | 0 |
| `compareMetricSources` | assets/app.js:6945 | 22 | 1 | 3 |
| `getSheetTitles` | assets/app.js:6884 | 6 | 1 | 2 |
| `loadMarketCatalog` | assets/app.js:7209 | 12 | 1 | 4 |
| `marketFind` | assets/app.js:7222 | 2 | 1 | 1 |
| `marketFlatten` | assets/app.js:7186 | 14 | 1 | 1 |
| `marketPriceFields` | assets/app.js:7200 | 9 | 2 | 1 |
| `metricLatestInfo` | assets/app.js:6930 | 15 | 1 | 5 |
| `metricRowKey` | assets/app.js:6929 | 1 | 2 | 0 |
| `metricTimeout` | assets/app.js:6967 | 6 | 2 | 1 |
| `pick` | assets/app.js:7201 | 2 | 1 | 0 |
| `podeSincronizarAgora` | assets/app.js:7101 | 14 | 1 | 0 |
| `readMetricsDirect` | assets/app.js:6897 | 3 | 1 | 0 |
| `readMetricSheet` | assets/app.js:6890 | 7 | 1 | 4 |
| `readMetricsWithoutPopup` | assets/app.js:6974 | 32 | 2 | 7 |
| `recoverMetricsAutomatically` | assets/app.js:7006 | 1 | 1 | 0 |
| `refreshMetricServerConfig` | assets/app.js:6923 | 6 | 1 | 1 |
| `renderMarket` | assets/app.js:7224 | 14 | 2 | 6 |
| `requestServerMetricSync` | assets/app.js:7133 | 1 | 1 | 0 |
| `runMetricAutoRecovery` | assets/app.js:7083 | 1 | 2 | 0 |
| `saveMetricSource` | assets/app.js:7162 | 17 | 1 | 3 |
| `sheetsFetch` | assets/app.js:6854 | 10 | 3 | 1 |
| `startMetricAutoRecovery` | assets/app.js:7119 | 14 | 1 | 3 |
| `stopMetricAutoRecovery` | assets/app.js:7115 | 4 | 1 | 0 |

## CDS CONFIRMADAS / GROUPS REMOVIDOS · 07/09/2026

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `cleanProfileValue` | assets/app.js:7878 | 1 | 2 | 0 |
| `profileCoordLike` | assets/app.js:7871 | 1 | 1 | 0 |
| `sourceToGroupPatch` | assets/app.js:7879 | 81 | 2 | 8 |
| `splitCoordPair` | assets/app.js:7872 | 6 | 1 | 0 |
| `updateOfficialGroupProfiles` | assets/app.js:7960 | 32 | 1 | 7 |

## CENTRAL DE COMANDO + PERFIL DE FACÇÃO EM PÁGINA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `activityButtons` | assets/app.js:10954 | 13 | 2 | 2 |
| `allSegmentNames` | assets/app.js:10908 | 5 | 1 | 2 |
| `applyCoreSegmentMap` | assets/app.js:11129 | 25 | 1 | 5 |
| `assignSegment` | assets/app.js:11079 | 27 | 1 | 8 |
| `availableAnnouncementText` | assets/app.js:10612 | 45 | 3 | 2 |
| `availableDiscordState` | assets/app.js:10730 | 10 | 7 | 1 |
| `availablePosted` | assets/app.js:10740 | 1 | **ninguém** | 2 |
| `beginEditSegment` | assets/app.js:11018 | 9 | 1 | 4 |
| `buildCraftRequestText` | assets/app.js:10393 | 1 | 1 | 0 |
| `closeCraftRequestModal` | assets/app.js:10470 | 1 | 1 | 1 |
| `closeOrganizationProfilePage` | assets/app.js:10225 | 1 | 1 | 1 |
| `craftRecipeKey` | assets/app.js:10375 | 1 | 1 | 0 |
| `createSegment` | assets/app.js:11027 | 52 | 1 | 12 |
| `dashboardGo` | assets/app.js:10300 | 1 | 1 | 1 |
| `deleteSegment` | assets/app.js:11106 | 23 | 1 | 12 |
| `downloadFreeFacCsv` | assets/app.js:10860 | 30 | 1 | 4 |
| `farmItemKey` | assets/app.js:10376 | 1 | 1 | 0 |
| `freeFaccoesForReport` | assets/app.js:10841 | 6 | 3 | 2 |
| `freeFacReportText` | assets/app.js:10847 | 13 | 2 | 4 |
| `ingredientDisplay` | assets/app.js:10377 | 1 | 1 | 0 |
| `isLaundryMachineRecipe` | assets/app.js:10387 | 1 | 1 | 0 |
| `isoDay` | assets/app.js:10236 | 1 | 4 | 1 |
| `openCraftRequestModal` | assets/app.js:10456 | 14 | 1 | 2 |
| `openMetricForGroup` | assets/app.js:10301 | 13 | 1 | 8 |
| `persistCurrentTechProfile` | assets/app.js:10487 | 1 | 1 | 0 |
| `refreshSegmentAssignEntities` | assets/app.js:10981 | 12 | 2 | 5 |
| `renderAvailableFaccoes` | assets/app.js:10741 | 57 | 5 | 12 |
| `renderAvailableSegmentCards` | assets/app.js:10944 | 10 | 1 | 3 |
| `renderCommandDashboard` | assets/app.js:10314 | 48 | 6 | 20 |
| `renderOrgActivityButtons` | assets/app.js:10967 | 9 | 1 | 2 |
| `renderSegmentAdmin` | assets/app.js:10993 | 14 | 4 | 10 |
| `renderVisualSegmentFilter` | assets/app.js:10917 | 1 | 2 | 0 |
| `same` | assets/app.js:10253 | 3 | 2 | 2 |
| `saveAvailableContingent` | assets/app.js:10693 | 37 | 1 | 5 |
| `saveAvailableImageLink` | assets/app.js:10658 | 35 | 1 | 4 |
| `saveSegmentRegistry` | assets/app.js:11007 | 9 | 2 | 8 |
| `segmentCardMarkup` | assets/app.js:10913 | 4 | 1 | 4 |
| `segmentUsage` | assets/app.js:10978 | 3 | 2 | 6 |
| `segmentVisual` | assets/app.js:10905 | 3 | 1 | 2 |
| `setAvailableDiscordState` | assets/app.js:10798 | 43 | 2 | 6 |
| `showFreeFacReport` | assets/app.js:10890 | 11 | 1 | 8 |
| `showOrganizationProfilePage` | assets/app.js:10207 | 1 | 1 | 0 |
| `startOfWeekMonday` | assets/app.js:10228 | 8 | 2 | 0 |
| `vacantMetricAnomalies` | assets/app.js:10283 | 17 | 1 | 6 |
| `weeklyContingentAlerts` | assets/app.js:10237 | 46 | 1 | 9 |

## CENTRAL DE SOLICITAÇÕES · PADRÕES OFICIAIS HIGH

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `allRequestModels` | assets/app.js:3275 | 2 | 1 | 0 |
| `applyRouteRequestToProfile` | assets/app.js:3337 | 57 | 1 | 14 |
| `buildRequestText` | assets/app.js:2830 | 400 | 1 | 7 |
| `copyRequestText` | assets/app.js:3516 | 37 | 2 | 8 |
| `defaultSubject` | assets/app.js:2757 | 39 | 6 | 0 |
| `fmtCds` | assets/app.js:2825 | 1 | 5 | 0 |
| `getDetailBlock` | assets/app.js:2807 | 18 | 2 | 1 |
| `getDetailValue` | assets/app.js:2797 | 10 | 3 | 1 |
| `initRequestUi` | assets/app.js:2712 | 35 | 1 | 10 |
| `loadRequests` | assets/app.js:3257 | 18 | 2 | 5 |
| `manualRequestMutation` | assets/app.js:3435 | 1 | 1 | 0 |
| `openRequestModal` | assets/app.js:3231 | 26 | 5 | 6 |
| `pushObs` | assets/app.js:2827 | 2 | 1 | 2 |
| `renderRequests` | assets/app.js:3277 | 27 | 2 | 7 |
| `requestRoutePoints` | assets/app.js:3304 | 10 | 2 | 2 |
| `requestTypeName` | assets/app.js:2747 | 1 | 7 | 0 |
| `saveRequestModel` | assets/app.js:3395 | 40 | 1 | 7 |
| `slug` | assets/app.js:3553 | 1 | 2 | 0 |
| `syncRequestFaction` | assets/app.js:2755 | 2 | 3 | 2 |
| `syncRouteRequestAction` | assets/app.js:3314 | 23 | 2 | 2 |
| `updateRequestGroupOptions` | assets/app.js:2748 | 7 | 2 | 4 |
| `upGarage` | assets/app.js:3442 | 6 | 1 | 1 |

## COMUNICAÇÃO FLUTUANTE + SPOTIFY CONNECT

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `base64url` | assets/app.js:11351 | 1 | 1 | 1 |
| `chatAttachmentHtml` | assets/app.js:11539 | 4 | 1 | 2 |
| `chatConversationId` | assets/app.js:11547 | 2 | 5 | 0 |
| `chatConversationQuery` | assets/app.js:11601 | 12 | 1 | 1 |
| `chatMeetingHtml` | assets/app.js:11544 | 3 | 1 | 2 |
| `chatParticipants` | assets/app.js:11553 | 2 | 2 | 0 |
| `chatStickerHtml` | assets/app.js:11543 | 1 | 1 | 2 |
| `chatTime` | assets/app.js:11532 | 2 | 1 | 0 |
| `deleteChatMessage` | assets/app.js:11665 | 7 | 1 | 3 |
| `hmInitials` | assets/app.js:11534 | 2 | 2 | 0 |
| `hmLastMessageFor` | assets/app.js:11566 | 2 | 1 | 1 |
| `hmUser` | assets/app.js:11536 | 1 | 4 | 0 |
| `hmUserName` | assets/app.js:11537 | 1 | 6 | 0 |
| `hmUserRole` | assets/app.js:11538 | 1 | 3 | 0 |
| `loadSpotifyConfig` | assets/app.js:11308 | 5 | 2 | 3 |
| `populateChatRecipients` | assets/app.js:11555 | 8 | 1 | 5 |
| `prepareChatAttachment` | assets/app.js:11686 | 8 | 1 | 2 |
| `privateChatItems` | assets/app.js:11563 | 3 | 1 | 1 |
| `renderChatAttachmentPreview` | assets/app.js:11678 | 8 | 2 | 2 |
| `renderChatMessages` | assets/app.js:11584 | 15 | 2 | 15 |
| `renderHmContacts` | assets/app.js:11568 | 8 | 4 | 8 |
| `renderSpotify` | assets/app.js:11313 | 9 | 3 | 5 |
| `renderSpotifyAuthUI` | assets/app.js:11494 | 8 | 3 | 3 |
| `saveSpotifyClient` | assets/app.js:11340 | 11 | 1 | 5 |
| `saveSpotifyConfig` | assets/app.js:11322 | 18 | 1 | 7 |
| `selectChatRecipient` | assets/app.js:11576 | 8 | 2 | 4 |
| `sendChatMessage` | assets/app.js:11642 | 1 | 2 | 0 |
| `spotifyApi` | assets/app.js:11420 | 1 | 7 | 0 |
| `spotifyCreatePlayer` | assets/app.js:11478 | 16 | 1 | 7 |
| `spotifyEmbedUrl` | assets/app.js:11303 | 4 | 2 | 2 |
| `spotifyHandleCallback` | assets/app.js:11373 | 23 | 1 | 2 |
| `spotifyLoadPlaylists` | assets/app.js:11516 | 8 | 2 | 4 |
| `spotifyLoadProfile` | assets/app.js:11429 | 5 | 1 | 2 |
| `spotifyLoadSDK` | assets/app.js:11434 | 7 | 1 | 1 |
| `spotifyLogin` | assets/app.js:11352 | 21 | 2 | 2 |
| `spotifyPlayContext` | assets/app.js:11524 | 3 | 1 | 1 |
| `spotifyPlayUri` | assets/app.js:11511 | 3 | 1 | 1 |
| `spotifyQueueUri` | assets/app.js:11514 | 2 | 1 | 1 |
| `spotifyRedirectUri` | assets/app.js:11307 | 1 | 4 | 1 |
| `spotifyRefreshToken` | assets/app.js:11396 | 15 | 1 | 0 |
| `spotifyRenderState` | assets/app.js:11447 | 22 | 1 | 3 |
| `spotifyRestoreSession` | assets/app.js:11411 | 9 | 2 | 4 |
| `spotifySearch` | assets/app.js:11502 | 9 | 1 | 5 |
| `spotifySetTab` | assets/app.js:11527 | 4 | 1 | 4 |
| `spotifyStartProgress` | assets/app.js:11475 | 3 | 1 | 1 |
| `spotifyTime` | assets/app.js:11445 | 2 | 1 | 1 |
| `spotifyUpdateProgress` | assets/app.js:11469 | 6 | 3 | 3 |
| `startChat` | assets/app.js:11639 | 3 | 2 | 3 |
| `stopChat` | assets/app.js:11613 | 1 | 2 | 0 |
| `subscribeChatConversation` | assets/app.js:11614 | 25 | 2 | 7 |
| `toggleFloatingChat` | assets/app.js:11672 | 6 | 1 | 3 |

## Dashboard

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alertStateId` | assets/app.js:164 | 1 | 2 | 0 |
| `dashboardHealth` | assets/app.js:107 | 5 | 1 | 0 |
| `loadDashboardAlertStates` | assets/app.js:160 | 4 | 3 | 2 |
| `loadDashboardConfig` | assets/app.js:91 | 16 | 1 | 6 |
| `renderDashboardConfigAdmin` | assets/app.js:112 | 15 | 3 | 2 |

## DOCUMENTO DAS FACÇÕES ↔ GOOGLE SHEETS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `facSheetApplyConfirmed` | assets/app.js:10103 | 42 | 1 | 8 |
| `facSheetAuthorize` | assets/app.js:9997 | 18 | 2 | 2 |
| `facSheetCheckForChanges` | assets/app.js:10079 | 16 | 1 | 6 |
| `facSheetClean` | assets/app.js:9960 | 1 | 2 | 0 |
| `facSheetComparable` | assets/app.js:9961 | 3 | 1 | 2 |
| `facSheetDiffForRecord` | assets/app.js:10060 | 19 | 1 | 3 |
| `facSheetFetch` | assets/app.js:10015 | 3 | 2 | 0 |
| `facSheetNorm` | assets/app.js:9957 | 1 | 3 | 0 |
| `facSheetPatchFromRow` | assets/app.js:9976 | 12 | 1 | 2 |
| `facSheetPushAll` | assets/app.js:10179 | 15 | 1 | 6 |
| `facSheetReadAll` | assets/app.js:10042 | 1 | 2 | 0 |
| `facSheetRenderStatus` | assets/app.js:9988 | 7 | 4 | 2 |
| `facSheetResolveTitle` | assets/app.js:10030 | 12 | 2 | 2 |
| `facSheetRowFromGroup` | assets/app.js:9964 | 1 | 1 | 0 |
| `facSheetSetLastCheck` | assets/app.js:9995 | 2 | 2 | 1 |
| `facSheetStatus` | assets/app.js:9958 | 2 | 2 | 0 |
| `renderFacSheetDiffModal` | assets/app.js:10095 | 8 | 1 | 3 |
| `syncGroupsToOfficialSheet` | assets/app.js:10145 | 2 | 3 | 0 |

## ECONOMIA DE COTA DAS METRICAS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyMetricSnapshot` | assets/app.js:5430 | 1 | 3 | 0 |
| `ensureMetricQuotaPanel` | assets/app.js:5462 | 15 | 1 | 0 |
| `enterQuotaMode` | assets/app.js:5320 | 21 | 4 | 5 |
| `isQuotaError` | assets/app.js:5313 | 7 | 4 | 1 |
| `metricReadCount` | assets/app.js:5459 | 3 | 2 | 0 |
| `metricRealtimeAtivo` | assets/app.js:5541 | 3 | 2 | 0 |
| `metricRowsPendentes` | assets/app.js:5343 | 25 | 1 | 3 |
| `persistMetricRows` | assets/app.js:5369 | 1 | 1 | 0 |
| `proximo` | assets/app.js:5489 | 8 | 1 | 1 |
| `renderMetricQuotaPanel` | assets/app.js:5477 | 59 | 6 | 8 |
| `setMetricRealtime` | assets/app.js:5544 | 8 | 1 | 2 |
| `startMetricRealtime` | assets/app.js:5552 | 18 | 2 | 8 |

## Formatação e utilidades

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `$` | assets/app.js:50 | 1 | 368 | 0 |
| `copyText` | assets/mission-planner.js:1728 | 1 | 12 | 0 |
| `esc` | assets/modules/formatadores.js:12 | 5 | 100 | 0 |
| `fmtBackupData` | assets/mission-planner.js:1934 | 3 | 1 | 1 |
| `fmtDateMs` | assets/modules/formatadores.js:27 | 1 | 3 | 0 |
| `fmtDuration` | assets/modules/formatadores.js:20 | 6 | 4 | 1 |
| `fmtMoneyMaybe` | assets/modules/formatadores.js:29 | 4 | 2 | 1 |
| `normalizeCenter` | assets/mission-planner.js:667 | 1 | 2 | 3 |
| `normalizeMetricDate` | assets/modules/metricas-parser.js:29 | 14 | 5 | 2 |
| `normalizeMetricSlotKey` | assets/modules/metricas-parser.js:48 | 11 | 4 | 1 |
| `normalizePoint` | assets/mission-planner.js:668 | 9 | 5 | 2 |
| `normalizeText` | assets/mission-planner.js:739 | 1 | 4 | 0 |
| `num` | assets/mission-planner.js:532 | 1 | 8 | 0 |
| `parseBulk` | assets/mission-planner.js:1519 | 4 | 1 | 3 |
| `parseCds` | assets/mission-planner.js:619 | 30 | 4 | 2 |
| `parseCsvRows` | assets/modules/metricas-parser.js:205 | 19 | 2 | 1 |
| `parseMetricNumber` | assets/modules/metricas-parser.js:44 | 3 | 3 | 0 |
| `parseMetricSheet` | assets/modules/metricas-parser.js:81 | 123 | 3 | 9 |
| `show` | assets/app.js:1091 | 4 | 7 | 0 |
| `slugify` | assets/mission-planner.js:553 | 1 | 2 | 1 |

## GESTÃO DE USUÁRIOS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyPermissionPreset` | assets/app.js:3576 | 7 | 1 | 3 |
| `assertAdmin` | assets/app.js:3612 | 2 | 4 | 0 |
| `initUsersUi` | assets/app.js:3583 | 29 | 1 | 8 |
| `loadUsers` | assets/app.js:3614 | 13 | 3 | 6 |
| `openUserModal` | assets/app.js:3650 | 13 | 2 | 4 |
| `readUserPermissions` | assets/app.js:3573 | 3 | 1 | 1 |
| `renderUserPermissionMatrix` | assets/app.js:3564 | 1 | 3 | 0 |
| `renderUsers` | assets/app.js:3627 | 23 | 2 | 7 |
| `saveUser` | assets/app.js:3663 | 13 | 1 | 12 |
| `toggleUserAccess` | assets/app.js:3676 | 12 | 1 | 7 |

## GROUP COMO PATRIMÔNIO + ENTREGA COMO VÍNCULO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `currentDeliveryRequests` | assets/app.js:4347 | 109 | 3 | 5 |
| `deliveryExtractV5` | assets/app.js:4321 | 26 | 2 | 5 |
| `derivedOrganizations` | assets/app.js:4067 | 26 | 7 | 2 |
| `facSegmentsAvailable` | assets/app.js:3982 | 5 | 1 | 1 |
| `fillDeliveryFromGroup` | assets/app.js:4296 | 24 | 2 | 6 |
| `initDeliveryUi` | assets/app.js:4040 | 24 | 1 | 8 |
| `installedCount` | assets/app.js:3979 | 1 | 2 | 2 |
| `installedValue` | assets/app.js:3973 | 5 | 5 | 1 |
| `isInstalled` | assets/app.js:3978 | 1 | 6 | 1 |
| `loadDeliveries` | assets/app.js:4261 | 6 | 2 | 5 |
| `loadOrganizations` | assets/app.js:4093 | 7 | 2 | 6 |
| `openNewDelivery` | assets/app.js:4284 | 12 | 3 | 5 |
| `openOrganizationByName` | assets/app.js:4183 | 30 | 2 | 13 |
| `orgHistory` | assets/app.js:4177 | 6 | 1 | 4 |
| `orgKey` | assets/app.js:4066 | 1 | 10 | 2 |
| `orgSegmentsAvailable` | assets/app.js:4104 | 15 | 1 | 1 |
| `orgSegmentValue` | assets/app.js:4103 | 1 | 9 | 0 |
| `renderDefaultDeliveryProfile` | assets/app.js:3963 | 9 | 1 | 6 |
| `renderDeliveries` | assets/app.js:4267 | 17 | 2 | 2 |
| `renderFacSegmentChips` | assets/app.js:3987 | 10 | 1 | 6 |
| `renderOrganizations` | assets/app.js:4142 | 34 | 6 | 11 |
| `renderOrgSegmentChips` | assets/app.js:4119 | 23 | 2 | 6 |
| `saveNewDelivery` | assets/app.js:4465 | 90 | 1 | 14 |
| `selectedDeliveryBenefits` | assets/app.js:4320 | 1 | 3 | 0 |
| `syncOrgOptions` | assets/app.js:4100 | 3 | 1 | 3 |
| `updateNewDeliveryPreview` | assets/app.js:4456 | 4 | 3 | 4 |
| `upsertOrganizationFromDelivery` | assets/app.js:4242 | 19 | 1 | 4 |

## HIGH CALL NATIVO (WebRTC + Firestore)

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `acceptIncomingCall` | assets/app.js:11801 | 18 | 1 | 13 |
| `bindRemoteStream` | assets/app.js:11734 | 4 | 1 | 1 |
| `callDocRef` | assets/app.js:11699 | 1 | 5 | 0 |
| `callUiStatus` | assets/app.js:11703 | 2 | 5 | 1 |
| `closeTeamMeeting` | assets/app.js:11828 | 20 | 5 | 4 |
| `createPeer` | assets/app.js:11738 | 22 | 2 | 7 |
| `prepareLocalMedia` | assets/app.js:11720 | 14 | 2 | 3 |
| `rejectIncomingCall` | assets/app.js:11819 | 3 | 1 | 3 |
| `rtcCandidate` | assets/app.js:11702 | 1 | 1 | 0 |
| `rtcDesc` | assets/app.js:11700 | 2 | 2 | 0 |
| `setCallButtons` | assets/app.js:11705 | 7 | 4 | 1 |
| `showCallOverlay` | assets/app.js:11712 | 8 | 2 | 2 |
| `startCallInbox` | assets/app.js:11822 | 6 | 1 | 7 |
| `startTeamMeeting` | assets/app.js:11763 | 38 | 1 | 16 |
| `toggleCallCam` | assets/app.js:11851 | 3 | 1 | 1 |
| `toggleCallMic` | assets/app.js:11848 | 3 | 1 | 1 |
| `toggleHmPicker` | assets/app.js:11854 | 38 | 2 | 3 |
| `watchActiveCall` | assets/app.js:11760 | 3 | 2 | 6 |

## HISTORICO PAGINADO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `buscarHistoricoCompleto` | assets/app.js:4755 | 12 | 1 | 4 |
| `loadHistory` | assets/app.js:4684 | 1 | 3 | 0 |
| `openRecollectEvidence` | assets/app.js:4733 | 14 | 1 | 4 |
| `renderGroupProfileMemory` | assets/app.js:4831 | 14 | 1 | 6 |
| `renderHistory` | assets/app.js:4797 | 34 | 2 | 9 |
| `renderHistoryFooter` | assets/app.js:4767 | 30 | 1 | 4 |

## LEITURA DO CADASTRO COM DIAGNOSTICO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `activateAppPage` | assets/app.js:1512 | 17 | 14 | 8 |
| `carregarCadastro` | assets/app.js:1417 | 45 | 1 | 4 |
| `closeGroupProfilePage` | assets/app.js:1547 | 1 | 1 | 1 |
| `loadFaccoes` | assets/app.js:1550 | 8 | 16 | 6 |
| `renderFaccoes` | assets/app.js:1558 | 24 | 6 | 7 |
| `showGroupProfilePage` | assets/app.js:1529 | 18 | 2 | 4 |

## METRICAS SEM CUSTO DE LEITURA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `agruparPorMes` | assets/app.js:5620 | 15 | 1 | 1 |
| `aplicarLinhasMetricas` | assets/app.js:5757 | 16 | 1 | 4 |
| `assinaturaMes` | assets/app.js:5635 | 10 | 1 | 1 |
| `buildMetricReportHtml` | assets/app.js:5973 | 13 | 2 | 6 |
| `compactarLinhas` | assets/app.js:5608 | 6 | 1 | 0 |
| `downloadMetricCsv` | assets/app.js:6003 | 24 | 1 | 6 |
| `expandirLinhas` | assets/app.js:5614 | 6 | 1 | 0 |
| `lerEspelhoMensal` | assets/app.js:5725 | 31 | 1 | 5 |
| `loadMetrics` | assets/app.js:5774 | 67 | 3 | 17 |
| `metricAggregateDays` | assets/app.js:6142 | 10 | 2 | 4 |
| `metricCalendarRange31` | assets/app.js:6043 | 53 | 1 | 4 |
| `metricCurrentScope` | assets/app.js:5907 | 1 | 4 | 1 |
| `metricDailyBars` | assets/app.js:6096 | 14 | 1 | 4 |
| `metricDailyCard` | assets/app.js:6161 | 11 | 1 | 2 |
| `metricDailyReportText` | assets/app.js:6216 | 20 | 1 | 7 |
| `metricDailySummary` | assets/app.js:6110 | 12 | 1 | 0 |
| `metricDateLabel` | assets/app.js:5890 | 2 | 3 | 1 |
| `metricDayAverage` | assets/app.js:5892 | 2 | 4 | 1 |
| `metricFmtDay` | assets/app.js:6160 | 1 | 2 | 1 |
| `metricIdentity` | assets/app.js:5841 | 10 | 6 | 2 |
| `metricMainSortValue` | assets/app.js:6264 | 9 | 1 | 1 |
| `metricMesDe` | assets/app.js:5600 | 6 | 1 | 1 |
| `metricModeValue` | assets/app.js:5897 | 3 | 1 | 0 |
| `metricPeriodRange` | assets/app.js:5894 | 3 | 2 | 2 |
| `metricReportData` | assets/app.js:5956 | 17 | 1 | 5 |
| `metricScopeTitle` | assets/app.js:6135 | 7 | 2 | 3 |
| `metricSegmentSummary` | assets/app.js:6122 | 12 | 1 | 3 |
| `metricSelectedGroup` | assets/app.js:5909 | 1 | 1 | 2 |
| `metricSnapshot` | assets/app.js:5851 | 1 | 2 | 0 |
| `metricSortLabel` | assets/app.js:6258 | 6 | 1 | 1 |
| `metricSortRows` | assets/app.js:5900 | 7 | 2 | 3 |
| `metricSummaryRows` | assets/app.js:5862 | 28 | 8 | 9 |
| `metricTimeline` | assets/app.js:6030 | 13 | 2 | 4 |
| `metricTimeMinutes` | assets/app.js:6028 | 2 | 1 | 0 |
| `metricWeekBounds` | assets/app.js:6152 | 8 | 2 | 0 |
| `metricWeekSvg` | assets/app.js:6172 | 14 | 1 | 3 |
| `name` | assets/app.js:5902 | 2 | 35 | 2 |
| `printMetricDailyReport` | assets/app.js:6236 | 5 | 1 | 3 |
| `printMetricReport` | assets/app.js:5994 | 9 | 1 | 5 |
| `renderMetricExecutiveVisuals` | assets/app.js:6242 | 16 | 1 | 8 |
| `renderMetricFactionDetail` | assets/app.js:5934 | 22 | 4 | 9 |
| `renderMetricIntelligence` | assets/app.js:6186 | 30 | 1 | 11 |
| `renderMetricQuickRanking` | assets/app.js:6273 | 9 | 1 | 4 |
| `renderMetricReport` | assets/app.js:5986 | 8 | 3 | 3 |
| `salvarEspelhoMensal` | assets/app.js:5648 | 75 | 2 | 11 |
| `syncMetricSelectors` | assets/app.js:5910 | 24 | 3 | 3 |
| `y` | assets/app.js:6182 | 1 | 28 | 0 |

## ORGANIZAÇÕES UNIFICADAS + ROTA PADRÃO IMPLÍCITA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `addPoint` | assets/app.js:12955 | 14 | 1 | 6 |
| `c` | assets/app.js:13609 | 1 | 33 | 0 |
| `fmt` | assets/app.js:12689 | 1 | 3 | 2 |
| `grConfirmRouteRemovalV836` | assets/app.js:12319 | 41 | 1 | 10 |
| `gsAdd` | assets/app.js:12475 | 6 | 1 | 4 |
| `gsCardCoord` | assets/app.js:12814 | 1 | 1 | 2 |
| `gsCleanRow` | assets/app.js:12787 | 4 | 1 | 0 |
| `gsCoord` | assets/app.js:12407 | 1 | 7 | 1 |
| `gsEnsureMap` | assets/app.js:12423 | 19 | 2 | 2 |
| `gsIcon` | assets/app.js:12408 | 15 | 1 | 1 |
| `gsImportArmas01` | assets/app.js:12498 | 65 | 2 | 2 |
| `gsLegacyCatalog` | assets/app.js:12610 | 1 | 1 | 0 |
| `gsMergeLegacy` | assets/app.js:12656 | 16 | 2 | 4 |
| `gsMigrateCurrent` | assets/app.js:12672 | 7 | 1 | 7 |
| `gsModalHtml` | assets/app.js:12826 | 1 | 1 | 0 |
| `gsNorm` | assets/app.js:12609 | 1 | 5 | 0 |
| `gsOpenEditor` | assets/app.js:12828 | 43 | 2 | 10 |
| `gsPersist` | assets/app.js:12791 | 19 | 2 | 7 |
| `gsRender` | assets/app.js:12459 | 16 | 8 | 11 |
| `gsRenderKpis` | assets/app.js:12815 | 5 | 1 | 3 |
| `gsRenderMap` | assets/app.js:12442 | 17 | 4 | 11 |
| `gsRequestText` | assets/app.js:12686 | 7 | 2 | 5 |
| `gsRows` | assets/app.js:12404 | 3 | 13 | 2 |
| `gsSave` | assets/app.js:12481 | 17 | 1 | 8 |
| `gsSetView` | assets/app.js:12820 | 6 | 1 | 3 |
| `gsStatusText` | assets/app.js:12810 | 4 | 2 | 0 |
| `isOperational` | assets/app.js:12254 | 4 | 1 | 5 |
| `isRegisteredAvailable` | assets/app.js:12250 | 3 | 2 | 2 |
| `key` | assets/app.js:12661 | 4 | 19 | 1 |
| `mgmtAction` | assets/app.js:13580 | 6 | 3 | 0 |
| `mgmtBarSvg` | assets/app.js:13630 | 3 | 1 | 3 |
| `mgmtBuild` | assets/app.js:13535 | 44 | 4 | 6 |
| `mgmtDayKey` | assets/app.js:13502 | 1 | 2 | 1 |
| `mgmtDownloadGeneralReport` | assets/app.js:13661 | 8 | 1 | 3 |
| `mgmtEscHtml` | assets/app.js:13626 | 4 | 2 | 0 |
| `mgmtFiltered` | assets/app.js:13591 | 6 | 1 | 2 |
| `mgmtGeneralReportText` | assets/app.js:13610 | 16 | 3 | 9 |
| `mgmtLabel` | assets/app.js:13579 | 1 | 3 | 0 |
| `mgmtMedian` | assets/app.js:13531 | 4 | 1 | 0 |
| `mgmtMessage` | assets/app.js:13586 | 5 | 1 | 3 |
| `mgmtOpenMessage` | assets/app.js:13690 | 5 | 1 | 3 |
| `mgmtOpenRichReport` | assets/app.js:13654 | 7 | 1 | 2 |
| `mgmtPct` | assets/app.js:13528 | 1 | 3 | 0 |
| `mgmtPeriodStats` | assets/app.js:13508 | 20 | 1 | 5 |
| `mgmtPrintGeneralReport` | assets/app.js:13669 | 7 | 1 | 3 |
| `mgmtRichReportHtml` | assets/app.js:13633 | 21 | 1 | 9 |
| `mgmtRowsFor` | assets/app.js:13507 | 1 | 1 | 2 |
| `mgmtSegmentReport` | assets/app.js:13606 | 4 | 1 | 2 |
| `mgmtStart` | assets/app.js:13503 | 4 | 1 | 0 |
| `mgmtSummaryText` | assets/app.js:13597 | 9 | 1 | 3 |
| `mgmtTrendText` | assets/app.js:13529 | 2 | 5 | 1 |
| `norm` | assets/app.js:13740 | 1 | 1 | 0 |
| `orgV92ActionMarkup` | assets/app.js:13787 | 12 | 1 | 3 |
| `orgV92Audit` | assets/app.js:13739 | 15 | 1 | 2 |
| `orgV92Filtered` | assets/app.js:13754 | 15 | 1 | 4 |
| `orgV92HasOccupant` | assets/app.js:13709 | 1 | **ninguém** | 0 |
| `orgV92HasQG` | assets/app.js:13710 | 1 | 1 | 0 |
| `orgV92OpenReport` | assets/app.js:13838 | 15 | 1 | 8 |
| `orgV92ReportRows` | assets/app.js:13835 | 2 | 1 | 2 |
| `orgV92ReportTitle` | assets/app.js:13837 | 1 | 1 | 0 |
| `orgV92Rows` | assets/app.js:13736 | 3 | 4 | 3 |
| `orgV92Segment` | assets/app.js:13720 | 1 | 1 | 0 |
| `orgV92Status` | assets/app.js:13716 | 1 | 1 | 0 |
| `orgV92StatusClass` | assets/app.js:13719 | 1 | 1 | 0 |
| `orgV92StatusLabel` | assets/app.js:13718 | 1 | 2 | 0 |
| `pullMissionsFromCloud` | assets/app.js:13869 | 19 | 1 | 1 |
| `pushMissionsToCloud` | assets/app.js:13888 | 25 | 1 | 4 |
| `renderFacActivityButtons` | assets/app.js:13769 | 12 | 1 | 2 |
| `renderIllegalManagement` | assets/app.js:13676 | 14 | 3 | 9 |
| `setMode` | assets/app.js:12838 | 4 | 1 | 2 |
| `speakerRows` | assets/app.js:13101 | 1 | 1 | 0 |
| `sync` | assets/app.js:12473 | 1 | 7 | 3 |
| `syncType` | assets/app.js:13093 | 4 | 1 | 1 |
| `v8361CardImageUrl` | assets/app.js:12570 | 8 | 1 | 1 |
| `v836ApplyUnifiedUi` | assets/app.js:12304 | 10 | 1 | 1 |
| `v836CardImage` | assets/app.js:12240 | 2 | 2 | 3 |
| `v836Occupied` | assets/app.js:12232 | 1 | 3 | 1 |
| `v836RenderOrganizations` | assets/app.js:12242 | 58 | 1 | 21 |
| `v836RouteLabel` | assets/app.js:12236 | 4 | 1 | 3 |
| `v836RoutePoints` | assets/app.js:12233 | 3 | 2 | 4 |
| `v9010CommitStructure` | assets/app.js:13407 | 81 | 1 | 14 |
| `v908EditorHtml` | assets/app.js:13279 | 1 | 1 | 0 |
| `v9CleanRows` | assets/app.js:12985 | 8 | 3 | 0 |
| `v9Clone` | assets/app.js:12983 | 1 | 3 | 0 |
| `v9Diff` | assets/app.js:13005 | 16 | 2 | 3 |
| `v9EditorHtml` | assets/app.js:13067 | 1 | 1 | 0 |
| `v9MarkDirty` | assets/app.js:12993 | 10 | 1 | 3 |
| `v9QGCds` | assets/app.js:13003 | 2 | 1 | 2 |
| `v9SaveAll` | assets/app.js:13215 | 24 | 1 | 12 |
| `v9ShowRequest` | assets/app.js:13061 | 6 | 2 | 3 |
| `v9StructureRequest` | assets/app.js:13021 | 40 | 2 | 3 |

## PAINEL DE SAUDE DO SISTEMA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `saudeCartao` | assets/app.js:3744 | 7 | 1 | 2 |
| `saudeTempoDesde` | assets/app.js:3725 | 10 | 1 | 2 |
| `saudeUltimaSync` | assets/app.js:3738 | 6 | 1 | 0 |
| `saudeUltimoBackup` | assets/app.js:3735 | 3 | 1 | 0 |

## PARSER DA PLANILHA OFICIAL + GOOGLE SHEETS SOMENTE LEITURA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `a1SheetName` | assets/app.js:5259 | 1 | 1 | 2 |
| `activeMetricRows` | assets/app.js:5099 | 9 | 6 | 7 |
| `currentMetricMonthKey` | assets/app.js:5086 | 2 | 7 | 1 |
| `extractSpreadsheetId` | assets/app.js:5246 | 13 | 5 | 2 |
| `f` | assets/app.js:5108 | 2 | 108 | 1 |
| `isPublishedSheetUrl` | assets/app.js:5207 | 4 | 2 | 0 |
| `metricActivePeriodLabel` | assets/app.js:5108 | 3 | 4 | 4 |
| `metricAnalysis` | assets/app.js:5159 | 43 | 5 | 4 |
| `metricDateValue` | assets/app.js:5042 | 11 | 12 | 2 |
| `metricGroupOccupied` | assets/app.js:5098 | 1 | 3 | 2 |
| `metricGroupRecords` | assets/app.js:5128 | 1 | 1 | 3 |
| `metricMonthKey` | assets/app.js:5080 | 6 | 2 | 2 |
| `metricPeriodLabel` | assets/app.js:5088 | 8 | 6 | 3 |
| `metricPredominanceRange` | assets/app.js:5129 | 30 | 2 | 1 |
| `metricSlotKeys` | assets/app.js:5078 | 1 | 3 | 2 |
| `metricSlotMinutes` | assets/app.js:5054 | 5 | 4 | 1 |
| `metricSlots` | assets/app.js:5059 | 19 | 19 | 2 |
| `metricTsToDate` | assets/app.js:5261 | 8 | 1 | 0 |
| `occupied` | assets/app.js:5100 | 1 | 5 | 1 |
| `parseIsoMetricDate` | assets/app.js:5096 | 2 | 4 | 1 |
| `publishedCsvUrl` | assets/app.js:5211 | 35 | 1 | 1 |
| `refreshMetricPeriodOptions` | assets/app.js:5116 | 12 | 3 | 5 |
| `renderMetricSourceStatus` | assets/app.js:5269 | 27 | 7 | 4 |
| `syncMetricDateInputs` | assets/app.js:5111 | 4 | 3 | 1 |

## PERFIL TÉCNICO + MEMÓRIA OPERACIONAL DO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `changedSummary` | assets/app.js:4615 | 49 | 1 | 1 |
| `formatHistoryDate` | assets/app.js:4573 | 6 | 5 | 1 |
| `historyDateValue` | assets/app.js:4564 | 9 | 6 | 0 |
| `historyFamily` | assets/app.js:4579 | 16 | 3 | 0 |
| `historyTitle` | assets/app.js:4595 | 20 | 5 | 2 |

## PERFIL TÉCNICO INTEGRADO AO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `addFarmItem` | assets/app.js:8880 | 6 | 1 | 1 |
| `addRecipe` | assets/app.js:8849 | 3 | 1 | 2 |
| `archiveTechnicalRequest` | assets/app.js:9034 | 1 | 4 | 0 |
| `canonicalProductImage` | assets/app.js:8646 | 12 | 2 | 1 |
| `clonePlain` | assets/app.js:8589 | 1 | 11 | 0 |
| `closeFarmEditor` | assets/app.js:8861 | 1 | 1 | 1 |
| `closeGroupSettingsPage` | assets/app.js:9567 | 15 | 1 | 3 |
| `closeRecipeEditor` | assets/app.js:8836 | 1 | 1 | 1 |
| `copyArchivedRequest` | assets/app.js:9071 | 6 | 1 | 0 |
| `defaultTechProfile` | assets/app.js:8716 | 1 | 1 | 0 |
| `editFarmItem` | assets/app.js:8862 | 18 | 2 | 3 |
| `editRecipe` | assets/app.js:8837 | 12 | 2 | 3 |
| `ensureBenefitsHome` | assets/app.js:9537 | 9 | 2 | 1 |
| `farmItemCard` | assets/app.js:8852 | 2 | 1 | 3 |
| `farmItemsFromCraft` | assets/app.js:8682 | 20 | 1 | 2 |
| `fmtRequestWhen` | assets/app.js:9069 | 1 | 1 | 0 |
| `getTechProfileFromForm` | assets/app.js:8787 | 23 | 4 | 4 |
| `ingredientEditorRow` | assets/app.js:8822 | 1 | 1 | 0 |
| `itemImg` | assets/app.js:8658 | 2 | 6 | 2 |
| `mergedTechProfile` | assets/app.js:8743 | 1 | 18 | 0 |
| `mergeRecipeLists` | assets/app.js:8567 | 12 | 1 | 2 |
| `opBlank` | assets/app.js:9199 | 26 | 1 | 0 |
| `openGroupSettingsPage` | assets/app.js:9546 | 21 | 1 | 5 |
| `operationalFromExisting` | assets/app.js:9248 | 1 | 1 | 0 |
| `operationalFromForm` | assets/app.js:9309 | 56 | 2 | 1 |
| `opGet` | assets/app.js:9308 | 1 | 1 | 1 |
| `opMerge` | assets/app.js:9225 | 1 | 1 | 0 |
| `opPair` | assets/app.js:9196 | 3 | 1 | 0 |
| `readIngredientEditor` | assets/app.js:8832 | 4 | 2 | 1 |
| `recipeCard` | assets/app.js:8810 | 2 | 1 | 3 |
| `recipeNormalize` | assets/app.js:8660 | 1 | 3 | 0 |
| `renderConnectedRequests` | assets/app.js:9077 | 17 | 5 | 8 |
| `renderCraftRecipes` | assets/app.js:8812 | 10 | 2 | 7 |
| `renderFarmItems` | assets/app.js:8854 | 7 | 4 | 5 |
| `renderIngredientEditor` | assets/app.js:8824 | 8 | 2 | 5 |
| `renderOperationalProfile` | assets/app.js:9367 | 1 | 1 | 0 |
| `renderRouteOverview` | assets/app.js:8909 | 26 | 4 | 4 |
| `renderStructureSnapshot` | assets/app.js:8942 | 32 | 2 | 7 |
| `renderTechProfile` | assets/app.js:8771 | 16 | 5 | 9 |
| `requestFingerprint` | assets/app.js:9033 | 1 | 2 | 0 |
| `routePointList` | assets/app.js:8886 | 11 | 6 | 0 |
| `segmentKey` | assets/app.js:8536 | 1 | 16 | 1 |
| `setOpVal` | assets/app.js:9365 | 2 | 2 | 1 |
| `setRouteExclusive` | assets/app.js:8897 | 12 | 1 | 4 |
| `standardRecipesForGroup` | assets/app.js:8537 | 1 | 1 | 0 |
| `syncFarmWithCraft` | assets/app.js:8702 | 14 | 4 | 1 |
| `syncOperationalLegacy` | assets/app.js:9443 | 29 | 1 | 3 |
| `techAutoRequests` | assets/app.js:8974 | 49 | 1 | 5 |
| `toggleRoutePoints` | assets/app.js:8935 | 7 | 1 | 1 |

## PERMISSÕES GRANULARES POR MÓDULO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyModuleAccess` | assets/app.js:1357 | 12 | 2 | 6 |
| `canEditModule` | assets/app.js:1354 | 2 | 7 | 3 |
| `canViewModule` | assets/app.js:1351 | 3 | 9 | 3 |
| `defaultPermissionsForRole` | assets/app.js:1325 | 14 | 6 | 0 |
| `effectivePermissions` | assets/app.js:1339 | 11 | 3 | 2 |
| `firstAllowedModule` | assets/app.js:1356 | 1 | 2 | 1 |
| `moduleForElement` | assets/app.js:1373 | 17 | 1 | 1 |
| `mutationButton` | assets/app.js:1369 | 4 | 1 | 1 |
| `normalizePermission` | assets/app.js:1321 | 4 | 4 | 0 |
| `pageModule` | assets/app.js:1350 | 1 | 4 | 0 |
| `permissionDeniedMessage` | assets/app.js:1390 | 2 | 6 | 2 |

## Planejador de missões

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `plannerPanel` | assets/mission-planner.js:1920 | 1 | 1 | 2 |

## RESUMO EXECUTIVO / CADASTRO RECOLHIDO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `put` | assets/app.js:9594 | 2 | 1 | 1 |
| `renderGroupOverview` | assets/app.js:9589 | 30 | 1 | 5 |

## ROTA EXCLUSIVA + MAPA OPERACIONAL DO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `grCollectStructures` | assets/app.js:12007 | 54 | 2 | 7 |
| `grCurrent` | assets/app.js:11958 | 3 | 18 | 2 |
| `grDeleteRoute` | assets/app.js:12176 | 29 | 1 | 12 |
| `grEnsureMap` | assets/app.js:12061 | 20 | 1 | 2 |
| `grFmtPoint` | assets/app.js:11957 | 1 | 4 | 1 |
| `grMapPng` | assets/app.js:12205 | 9 | 1 | 3 |
| `grParseCoord` | assets/app.js:11942 | 11 | 5 | 1 |
| `grParseRoute` | assets/app.js:11953 | 4 | 5 | 1 |
| `grRenderMap` | assets/app.js:12093 | 16 | 3 | 10 |
| `grRenderRouteUi` | assets/app.js:12119 | 15 | 5 | 8 |
| `grRenderRows` | assets/app.js:12109 | 10 | 2 | 5 |
| `grRequestText` | assets/app.js:11962 | 41 | 3 | 6 |
| `grRouteIcon` | assets/app.js:12081 | 6 | 3 | 1 |
| `grSavedPoints` | assets/app.js:11961 | 1 | 6 | 4 |
| `grSaveRoute` | assets/app.js:12134 | 42 | 1 | 16 |
| `grShowRequest` | assets/app.js:12003 | 4 | 3 | 2 |
| `grStructIcon` | assets/app.js:12087 | 6 | 1 | 1 |
| `walk` | assets/app.js:12054 | 3 | 1 | 2 |

## Sem categoria

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `activate` | assets/mission-planner.js:2036 | 14 | 2 | 3 |
| `active` | assets/mission-planner.js:536 | 1 | 83 | 0 |
| `activeEventId` | assets/mission-planner.js:538 | 1 | 2 | 1 |
| `addManual` | assets/mission-planner.js:1606 | 12 | 1 | 9 |
| `adoptStrayCards` | assets/mission-planner.js:1921 | 7 | 1 | 3 |
| `alternar` | assets/mission-planner.js:1152 | 5 | 1 | 1 |
| `analyze` | assets/mission-planner.js:1402 | 12 | 1 | 4 |
| `anomalyAlertId` | assets/app.js:192 | 1 | 2 | 0 |
| `anomalyIsCleared` | assets/app.js:193 | 4 | 1 | 1 |
| `applyCloudMissions` | assets/mission-planner.js:861 | 3 | 1 | 1 |
| `applyOceanColor` | assets/mission-planner.js:973 | 7 | 2 | 1 |
| `applyRadius` | assets/mission-planner.js:1341 | 1 | 1 | 5 |
| `baixarBackup` | assets/mission-planner.js:1955 | 9 | 1 | 1 |
| `bind` | assets/mission-planner.js:1889 | 13 | 2 | 43 |
| `bindFormAutosave` | assets/mission-planner.js:1867 | 4 | 1 | 11 |
| `buildLayerControl` | assets/mission-planner.js:1107 | 53 | 1 | 8 |
| `cancelEdit` | assets/mission-planner.js:1453 | 2 | 6 | 4 |
| `captureSnapshot` | assets/mission-planner.js:1481 | 17 | 3 | 7 |
| `cardTabKey` | assets/mission-planner.js:1913 | 7 | 2 | 0 |
| `cdsProblemas` | assets/mission-planner.js:649 | 2 | 3 | 0 |
| `centralCategory` | assets/mission-planner.js:1839 | 1 | 1 | 0 |
| `chave` | assets/mission-planner.js:837 | 1 | 6 | 2 |
| `cleanSegmentName` | assets/app.js:257 | 1 | 2 | 0 |
| `clearLayers` | assets/mission-planner.js:1246 | 1 | 1 | 0 |
| `clearPoints` | assets/mission-planner.js:1727 | 1 | 1 | 3 |
| `clearVacantMetricAlert` | assets/app.js:197 | 20 | 1 | 7 |
| `cloneEventTo` | assets/mission-planner.js:1717 | 6 | 1 | 12 |
| `cloneZone` | assets/mission-planner.js:1712 | 5 | 1 | 9 |
| `close` | assets/mission-planner.js:1705 | 1 | 5 | 0 |
| `commit` | assets/mission-planner.js:1444 | 5 | 12 | 7 |
| `copyCurrentRequest` | assets/mission-planner.js:1830 | 1 | 1 | 4 |
| `copySelectedTp` | assets/mission-planner.js:1598 | 8 | 1 | 6 |
| `coverageStats` | assets/mission-planner.js:579 | 17 | 3 | 1 |
| `createEvent` | assets/mission-planner.js:1618 | 7 | 1 | 8 |
| `createZone` | assets/mission-planner.js:1625 | 10 | 2 | 11 |
| `definirGroupsConhecidos` | assets/modules/metricas-parser.js:18 | 3 | 2 | 0 |
| `deleteEvent` | assets/mission-planner.js:1663 | 8 | 1 | 6 |
| `deleteZone` | assets/mission-planner.js:1662 | 1 | 1 | 6 |
| `distXY` | assets/mission-planner.js:658 | 1 | 1 | 0 |
| `duplicateMission` | assets/mission-planner.js:1723 | 4 | **ninguém** | 2 |
| `effectiveEventRadius` | assets/mission-planner.js:596 | 3 | 9 | 1 |
| `ensureBackupCard` | assets/mission-planner.js:1978 | 18 | 1 | 4 |
| `ensureCenterValidationUi` | assets/mission-planner.js:1314 | 8 | 1 | 7 |
| `ensureCentralV954` | assets/mission-planner.js:1832 | 7 | 2 | 1 |
| `ensureCoverageUi` | assets/mission-planner.js:1336 | 16 | 1 | 11 |
| `ensureMapKpis` | assets/mission-planner.js:2030 | 6 | 1 | 1 |
| `ensurePlannerTabs` | assets/mission-planner.js:1996 | 22 | 1 | 4 |
| `ensureWorkspaceBar` | assets/mission-planner.js:1878 | 7 | 1 | 4 |
| `err` | assets/mission-planner.js:1208 | 1 | 19 | 3 |
| `eventOptions` | assets/mission-planner.js:1694 | 1 | 2 | 2 |
| `eventProfiles` | assets/mission-planner.js:1671 | 20 | 2 | 0 |
| `eventsOfCategory` | assets/mission-planner.js:543 | 10 | 5 | 1 |
| `eventUid` | assets/mission-planner.js:537 | 1 | 3 | 0 |
| `exportValidated` | assets/mission-planner.js:1729 | 2 | 1 | 6 |
| `exportXY` | assets/mission-planner.js:1731 | 1 | 1 | 6 |
| `findDashboardAlertState` | assets/app.js:165 | 1 | 2 | 1 |
| `fit` | assets/mission-planner.js:1502 | 1 | 6 | 3 |
| `fitZone` | assets/mission-planner.js:1383 | 6 | 2 | 4 |
| `focusActiveMission` | assets/mission-planner.js:1646 | 9 | 6 | 6 |
| `generateCircle` | assets/mission-planner.js:1503 | 16 | 2 | 9 |
| `generateInsideZone` | assets/mission-planner.js:1389 | 12 | 1 | 9 |
| `generateRequest` | assets/mission-planner.js:1732 | 98 | 2 | 9 |
| `getSnapshot` | assets/mission-planner.js:929 | 3 | 1 | 1 |
| `headingIcon` | assets/mission-planner.js:1240 | 6 | 1 | 1 |
| `importBulk` | assets/mission-planner.js:1523 | 7 | 1 | 10 |
| `inferLegacyStructure` | assets/mission-planner.js:554 | 24 | 2 | 3 |
| `initMap` | assets/mission-planner.js:1161 | 72 | 1 | 18 |
| `invalidateSelected` | assets/mission-planner.js:1589 | 9 | 1 | 5 |
| `isCenterValidated` | assets/mission-planner.js:666 | 1 | 4 | 2 |
| `isValidated` | assets/mission-planner.js:665 | 1 | 13 | 1 |
| `layer` | assets/mission-planner.js:942 | 20 | 7 | 2 |
| `ll` | assets/mission-planner.js:535 | 1 | 14 | 1 |
| `loadSegmentConfig` | assets/app.js:273 | 15 | 1 | 4 |
| `loadSnapshotPreview` | assets/mission-planner.js:1498 | 2 | 2 | 4 |
| `loadStore` | assets/mission-planner.js:908 | 7 | 1 | 7 |
| `makeCrs` | assets/mission-planner.js:933 | 6 | 1 | 0 |
| `mapNameOf` | assets/mission-planner.js:540 | 1 | 2 | 0 |
| `mapNotice` | assets/mission-planner.js:1039 | 13 | 3 | 3 |
| `mapsOfEvent` | assets/mission-planner.js:541 | 1 | **ninguém** | 2 |
| `mergeMissions` | assets/mission-planner.js:834 | 17 | 4 | 8 |
| `mergeOfficialPresets` | assets/mission-planner.js:888 | 19 | 1 | 2 |
| `metricGroupLabel` | assets/modules/metricas-parser.js:62 | 18 | 2 | 3 |
| `metricSlotLabel` | assets/modules/metricas-parser.js:60 | 1 | 2 | 1 |
| `newMission` | assets/mission-planner.js:710 | 28 | 2 | 5 |
| `nextPendingId` | assets/mission-planner.js:659 | 6 | 2 | 1 |
| `nowIso` | assets/mission-planner.js:533 | 1 | 15 | 0 |
| `ok` | assets/mission-planner.js:1207 | 1 | 30 | 1 |
| `openDb` | assets/mission-planner.js:916 | 7 | 2 | 0 |
| `openReplicator` | assets/mission-planner.js:1691 | 21 | 1 | 23 |
| `pinIcon` | assets/mission-planner.js:1234 | 6 | 1 | 2 |
| `pointDistanceFromCenter` | assets/mission-planner.js:599 | 1 | 4 | 0 |
| `pointInsideZone` | assets/mission-planner.js:600 | 1 | 1 | 3 |
| `presetMission` | assets/mission-planner.js:677 | 33 | 2 | 5 |
| `pushBackup` | assets/mission-planner.js:811 | 19 | 1 | 0 |
| `qs` | assets/mission-planner.js:3 | 1 | 66 | 0 |
| `qsa` | assets/mission-planner.js:4 | 1 | 8 | 0 |
| `queueSnapshot` | assets/mission-planner.js:1480 | 1 | 3 | 1 |
| `rawCds` | assets/mission-planner.js:1414 | 1 | 7 | 2 |
| `readBackups` | assets/mission-planner.js:830 | 3 | 1 | 0 |
| `refreshEvents` | assets/mission-planner.js:1702 | 1 | 1 | 3 |
| `reloadMapTiles` | assets/mission-planner.js:1052 | 23 | 1 | 6 |
| `render` | assets/mission-planner.js:1418 | 2 | 15 | 15 |
| `renderBackupList` | assets/mission-planner.js:1937 | 18 | 2 | 8 |
| `renderCenterValidation` | assets/mission-planner.js:1322 | 2 | 2 | 8 |
| `renderCentralV954` | assets/mission-planner.js:1845 | 21 | 2 | 16 |
| `renderCoverage` | assets/mission-planner.js:1352 | 30 | 5 | 8 |
| `renderMap` | assets/mission-planner.js:1247 | 44 | 4 | 14 |
| `renderMissionList` | assets/mission-planner.js:1292 | 3 | 1 | 1 |
| `renderPlannerBadges` | assets/mission-planner.js:2018 | 12 | 1 | 5 |
| `renderPointList` | assets/mission-planner.js:1296 | 9 | 1 | 14 |
| `renderWorkspaceBar` | assets/mission-planner.js:1885 | 3 | 2 | 2 |
| `repairFacxFacHierarchy` | assets/mission-planner.js:765 | 38 | 1 | 2 |
| `repairKnownZoneAssignments` | assets/mission-planner.js:740 | 24 | 1 | 3 |
| `requireEdit` | assets/mission-planner.js:1449 | 1 | 12 | 0 |
| `reservaKey` | assets/app.js:1111 | 1 | 1 | 0 |
| `restaurarArquivo` | assets/mission-planner.js:1964 | 14 | 1 | 5 |
| `run` | assets/mission-planner.js:1648 | 3 | 1 | 2 |
| `safeName` | assets/mission-planner.js:1500 | 1 | 1 | 1 |
| `sampleOceanFromTile` | assets/mission-planner.js:980 | 40 | 1 | 2 |
| `sanitizeDashboardConfig` | assets/app.js:77 | 1 | 3 | 0 |
| `saveDashboardConfig` | assets/app.js:127 | 33 | 1 | 7 |
| `saveMission` | assets/mission-planner.js:1452 | 1 | 1 | 7 |
| `saveSnapshot` | assets/mission-planner.js:923 | 6 | 1 | 3 |
| `saveStore` | assets/mission-planner.js:851 | 10 | 14 | 1 |
| `segmentDefs` | assets/app.js:258 | 1 | 7 | 0 |
| `segmentNames` | assets/app.js:259 | 1 | 6 | 1 |
| `selectEventForAction` | assets/mission-planner.js:1840 | 5 | 1 | 2 |
| `selectPoint` | assets/mission-planner.js:1305 | 8 | 4 | 8 |
| `set` | assets/mission-planner.js:2022 | 1 | 5 | 2 |
| `setCloudState` | assets/mission-planner.js:865 | 6 | 1 | 3 |
| `setDashboardAlertState` | assets/app.js:166 | 26 | 1 | 9 |
| `setPlannerTab` | assets/mission-planner.js:1928 | 6 | 1 | 2 |
| `setSaveState` | assets/mission-planner.js:1479 | 1 | 13 | 1 |
| `setStatus` | assets/mission-planner.js:962 | 1 | 5 | 1 |
| `setValidationFeedback` | assets/mission-planner.js:1530 | 4 | 5 | 1 |
| `setWorkspace` | assets/mission-planner.js:1872 | 6 | 5 | 2 |
| `startEdit` | assets/mission-planner.js:1450 | 2 | 6 | 5 |
| `startMapWatchdog` | assets/mission-planner.js:1075 | 25 | 2 | 5 |
| `switchEvent` | assets/mission-planner.js:1655 | 6 | **ninguém** | 6 |
| `switchMission` | assets/mission-planner.js:1661 | 1 | 1 | 6 |
| `tick` | assets/mission-planner.js:1078 | 20 | 1 | 4 |
| `tpCds` | assets/mission-planner.js:1415 | 1 | 3 | 2 |
| `trocarBase` | assets/mission-planner.js:1134 | 9 | 1 | 4 |
| `uid` | assets/mission-planner.js:534 | 1 | 4 | 0 |
| `updateEditUi` | assets/mission-planner.js:1455 | 24 | 6 | 2 |
| `updateExport` | assets/mission-planner.js:1416 | 2 | 1 | 5 |
| `validate` | assets/mission-planner.js:1703 | 2 | 2 | 7 |
| `validateBulk` | assets/mission-planner.js:1565 | 24 | 1 | 11 |
| `validateCenter` | assets/mission-planner.js:1324 | 11 | 1 | 9 |
| `validateSelected` | assets/mission-planner.js:1534 | 1 | 2 | 0 |
| `validCoord` | assets/mission-planner.js:607 | 1 | 22 | 0 |
| `watchOcean` | assets/mission-planner.js:1020 | 13 | 4 | 3 |
| `zoneCoverageCounts` | assets/mission-planner.js:601 | 5 | 2 | 3 |
| `zonesOfEvent` | assets/mission-planner.js:539 | 1 | 12 | 0 |
| `zonesOfMap` | assets/mission-planner.js:542 | 1 | **ninguém** | 2 |

## SESSÕES E AUDITORIA DE USUÁRIOS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `auditModule` | assets/app.js:3691 | 14 | 1 | 0 |
| `auditTarget` | assets/app.js:3705 | 1 | 1 | 0 |
| `isSameLocalDay` | assets/app.js:3712 | 1 | 1 | 0 |
| `sessionActions` | assets/app.js:3709 | 1 | 3 | 1 |
| `sessionDuration` | assets/app.js:3711 | 1 | 2 | 2 |
| `sessionEffectiveEnd` | assets/app.js:3710 | 1 | 3 | 4 |
| `sessionEndMs` | assets/app.js:3707 | 1 | 2 | 0 |
| `sessionStartMs` | assets/app.js:3706 | 1 | 5 | 0 |

## TRANSFERÊNCIA DE PAINEL, TROCA DE QG E ADMINISTRAÇÃO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `adminWipe` | assets/app.js:9852 | 33 | 1 | 5 |
| `cleanSnapshot` | assets/app.js:9673 | 4 | 1 | 1 |
| `isAdmin` | assets/app.js:9668 | 4 | 18 | 0 |
| `movementOpen` | assets/app.js:9678 | 37 | 1 | 6 |
| `movementPreview` | assets/app.js:9716 | 12 | 2 | 2 |
| `wipeCollection` | assets/app.js:9835 | 16 | 2 | 4 |

## UI KIT (script classico, carregado antes do app.js)

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `boot` | assets/ui-kit.js:221 | 1 | 1 | 5 |
| `classify` | assets/ui-kit.js:30 | 7 | 1 | 2 |
| `dismiss` | assets/ui-kit.js:72 | 5 | 1 | 0 |
| `ensureRegion` | assets/ui-kit.js:13 | 9 | 1 | 0 |
| `labelIconButtons` | assets/ui-kit.js:140 | 25 | 1 | 0 |
| `observarMudancas` | assets/ui-kit.js:209 | 11 | 1 | 1 |
| `rotularDinamicos` | assets/ui-kit.js:194 | 14 | 2 | 0 |
| `setOpen` | assets/ui-kit.js:121 | 5 | 1 | 0 |
| `setupNav` | assets/ui-kit.js:95 | 43 | 1 | 1 |
| `skipLink` | assets/ui-kit.js:167 | 10 | 1 | 0 |
| `toast` | assets/ui-kit.js:42 | 43 | 1 | 5 |
