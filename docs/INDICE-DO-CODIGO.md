# High OS · Índice do código

Gerado por `node tools/mapa-do-codigo.mjs --md`. Não edite à mão.

1472 funções, 40 categorias.

Para ver o impacto de remover uma função:

```
node tools/mapa-do-codigo.mjs nomeDaFuncao
```


## Administração

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `syncBlipsCoordinates` | assets/modules/blips-sheet-sync.js:140 | 1 | 1 | 0 |
| `syncConflicts` | assets/mission-planner.js:3776 | 1 | 1 | 0 |
| `syncEventKind` | assets/mission-planner.js:3754 | 6 | 3 | 8 |
| `syncForm` | assets/mission-planner.js:2325 | 22 | 2 | 5 |
| `syncMapRegion` | assets/mission-planner.js:2552 | 18 | 1 | 7 |
| `syncMissionsFromCloud` | assets/mission-planner.js:1064 | 16 | 2 | 8 |
| `syncPendingZones` | assets/mission-planner.js:954 | 21 | 2 | 8 |
| `syncSegmentSelects` | assets/app.js:345 | 13 | 5 | 6 |
| `syncStickyOffset` | assets/mission-planner.js:3852 | 6 | 1 | 2 |

## ADMINISTRAÇÃO MESTRE DE GROUPS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `adminGroupStatus` | assets/app.js:12872 | 1 | 3 | 0 |
| `closeAdminNewGroup` | assets/app.js:12975 | 4 | 2 | 1 |
| `createAdminNewGroup` | assets/app.js:12979 | 48 | 1 | 19 |
| `openAdminNewGroup` | assets/app.js:12965 | 10 | 1 | 5 |
| `renameAdminGroup` | assets/app.js:12901 | 60 | 1 | 13 |
| `renderAdminGroupManager` | assets/app.js:12873 | 28 | 4 | 11 |

## ADMINISTRAÇÃO ORGANIZADA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `normalizeOccupationStatusV820` | assets/app.js:13054 | 36 | 1 | 10 |
| `openAdminTab` | assets/app.js:13036 | 4 | 1 | 4 |

## Alvesinho

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alvesNorm` | assets/modules/metricas-parser.js:25 | 3 | 37 | 1 |

## ALVESINHO OPERACIONAL

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alvesFindGroup` | assets/app.js:6439 | 5 | **ninguém** | 3 |
| `alvesFindOrg` | assets/app.js:6444 | 10 | **ninguém** | 3 |

## Autenticação e sessão

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `closeCurrentSession` | assets/app.js:1200 | 28 | 1 | 3 |
| `login` | assets/app.js:1187 | 1 | 4 | 0 |
| `logout` | assets/app.js:1228 | 2 | 3 | 1 |
| `makeSessionId` | assets/app.js:1191 | 1 | 1 | 1 |
| `renderSessionClock` | assets/app.js:1271 | 21 | 3 | 6 |
| `sessionStorageKey` | assets/app.js:1190 | 1 | 3 | 0 |
| `startOrResumeSession` | assets/app.js:1230 | 41 | 1 | 6 |
| `startSessionClock` | assets/app.js:1292 | 3 | 1 | 1 |
| `touchSession` | assets/app.js:1301 | 10 | 1 | 1 |

## BOLETIM SEMANAL AUTOMATICO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `boletimAgregar` | assets/app.js:7794 | 17 | 1 | 6 |
| `boletimCalcular` | assets/app.js:7832 | 21 | 1 | 6 |
| `boletimDataBR` | assets/app.js:7781 | 3 | 1 | 1 |
| `boletimJanelas` | assets/app.js:7813 | 8 | 1 | 0 |
| `boletimParseData` | assets/app.js:7784 | 4 | 1 | 1 |
| `boletimPartes` | assets/app.js:7910 | 12 | 1 | 2 |
| `boletimPct` | assets/app.js:7826 | 5 | 1 | 1 |
| `boletimTexto` | assets/app.js:7854 | 54 | 1 | 6 |
| `boletimTotalLinha` | assets/app.js:7788 | 4 | 1 | 1 |
| `boletimVariacao` | assets/app.js:7822 | 4 | 1 | 0 |
| `iso` | assets/app.js:8294 | 1 | 6 | 1 |
| `loadMetricSourceConfig` | assets/app.js:8329 | 1 | 2 | 0 |
| `metricAdvancedStats` | assets/app.js:8063 | 40 | 4 | 8 |
| `movement` | assets/app.js:8023 | 1 | 1 | 4 |
| `openMetricSource` | assets/app.js:8302 | 15 | 1 | 1 |
| `parseMetricImport` | assets/app.js:8219 | 47 | 1 | 10 |
| `renderBoletim` | assets/app.js:7923 | 36 | 1 | 6 |
| `renderMetricAdvancedRanking` | assets/app.js:8103 | 25 | 3 | 9 |
| `renderMetricComparison` | assets/app.js:8135 | 33 | 3 | 8 |
| `renderMetrics` | assets/app.js:7960 | 103 | 4 | 39 |
| `renderRhFactionInsights` | assets/app.js:8168 | 8 | 1 | 6 |
| `saveMetricImport` | assets/app.js:8266 | 21 | 1 | 12 |
| `split` | assets/app.js:8223 | 1 | 1 | 1 |
| `switchMetricCenterView` | assets/app.js:8183 | 11 | 3 | 8 |
| `syncMetricCompareSelectors` | assets/app.js:8128 | 7 | 2 | 5 |
| `testMetricSource` | assets/app.js:8317 | 7 | 1 | 2 |

## BUSCA GLOBAL (Ctrl+K)

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `buscaAbrir` | assets/app.js:4536 | 8 | 1 | 2 |
| `buscaCasa` | assets/app.js:4478 | 4 | 1 | 1 |
| `buscaDestacar` | assets/app.js:4482 | 11 | 1 | 4 |
| `buscaFechar` | assets/app.js:4532 | 4 | 3 | 0 |
| `buscaMontar` | assets/app.js:4574 | 25 | 1 | 3 |
| `buscaNorm` | assets/app.js:4477 | 1 | 3 | 2 |
| `buscaRenderizar` | assets/app.js:4544 | 29 | 2 | 9 |
| `buscaResultados` | assets/app.js:4494 | 37 | 1 | 8 |
| `loadUserAudit` | assets/app.js:4644 | 1 | 4 | 0 |
| `openAuditSession` | assets/app.js:4688 | 1 | 1 | 14 |
| `openUserActivity` | assets/app.js:4692 | 1 | 1 | 4 |
| `renderSaudeSistema` | assets/app.js:4605 | 37 | **ninguém** | 9 |
| `renderUserAudit` | assets/app.js:4678 | 10 | 2 | 16 |

## CAMADA DE RESILIENCIA DO FIRESTORE

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `add` | assets/app.js:2633 | 3 | 13 | 0 |
| `addDoc` | assets/app.js:2118 | 7 | 34 | 6 |
| `assertRemoteWriteAvailable` | assets/app.js:2061 | 7 | 5 | 0 |
| `autoDeliveryRequests` | assets/app.js:2697 | 128 | 4 | 10 |
| `benefitLines` | assets/app.js:2565 | 35 | 1 | 4 |
| `buildDeliveryExtract` | assets/app.js:2600 | 22 | 2 | 4 |
| `cachedSnapshotOnly` | assets/app.js:2260 | 7 | 3 | 3 |
| `cacheEscrever` | assets/app.js:2222 | 11 | 4 | 2 |
| `cacheLer` | assets/app.js:2233 | 15 | 4 | 2 |
| `cacheNameFromRef` | assets/app.js:2031 | 9 | 1 | 0 |
| `changedBenefit` | assets/app.js:2622 | 1 | 1 | 0 |
| `closeRecollectModal` | assets/app.js:3083 | 2 | 1 | 1 |
| `comoSnapshot` | assets/app.js:2248 | 12 | 2 | 1 |
| `compressRecollectImage` | assets/app.js:3085 | 14 | 1 | 2 |
| `copyDeliveryExtract` | assets/app.js:2839 | 7 | 1 | 1 |
| `copyDeliveryRequests` | assets/app.js:2831 | 8 | 1 | 3 |
| `currentFactionFromForm` | assets/app.js:2540 | 25 | 3 | 6 |
| `currentPtBrDateTime` | assets/app.js:3036 | 10 | 1 | 2 |
| `deleteDoc` | assets/app.js:2125 | 5 | 2 | 4 |
| `discordFactionPatch` | assets/app.js:2088 | 1 | 2 | 0 |
| `discordPlain` | assets/app.js:2076 | 7 | 3 | 3 |
| `discordStoreRef` | assets/app.js:2068 | 8 | 5 | 0 |
| `entrarModoLocal` | assets/app.js:2272 | 13 | 1 | 1 |
| `getDocsCached` | assets/app.js:2315 | 1 | 2 | 0 |
| `getFormBenefits` | assets/app.js:2433 | 66 | 3 | 1 |
| `invalidarCacheRef` | assets/app.js:2040 | 19 | 3 | 2 |
| `mostrarFaixaModoLocal` | assets/app.js:2299 | 14 | 1 | 0 |
| `og` | assets/app.js:2630 | 2 | 1 | 1 |
| `openFac` | assets/app.js:2865 | 32 | 7 | 12 |
| `openRecollectModal` | assets/app.js:3066 | 17 | 1 | 7 |
| `operationalRequestAdditions` | assets/app.js:2624 | 1 | 1 | 0 |
| `packCache` | assets/app.js:2190 | 13 | 1 | 1 |
| `queryAindaFresca` | assets/app.js:2151 | 1 | 3 | 0 |
| `recollectExtract` | assets/app.js:3046 | 17 | 2 | 5 |
| `recollectReasonLabel` | assets/app.js:3029 | 7 | 4 | 1 |
| `renderDeliveryRequests` | assets/app.js:2825 | 4 | 1 | 4 |
| `resolveGroupIdentity` | assets/app.js:2847 | 1 | 3 | 0 |
| `sairModoLocal` | assets/app.js:2285 | 14 | 1 | 0 |
| `samePlain` | assets/app.js:2623 | 1 | 2 | 1 |
| `selectedDefaultBenefits` | assets/app.js:2539 | 1 | 2 | 1 |
| `setDoc` | assets/app.js:2103 | 15 | 31 | 7 |
| `setFormBenefits` | assets/app.js:2499 | 1 | 1 | 0 |
| `setRecollectPrint` | assets/app.js:3099 | 6 | 1 | 3 |
| `snapshot` | assets/app.js:3217 | 4 | 6 | 1 |
| `statBump` | assets/app.js:2155 | 13 | 4 | 0 |
| `unpackCache` | assets/app.js:2203 | 19 | 1 | 0 |
| `updateDeliveryPreview` | assets/app.js:2829 | 2 | 6 | 3 |
| `updateRecollectUi` | assets/app.js:3063 | 3 | 3 | 2 |
| `writeBatch` | assets/app.js:2131 | 9 | 12 | 5 |

## CAMADA DO GOOGLE SHEETS RESTAURADA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `authorizeSheets` | assets/app.js:8366 | 20 | 2 | 1 |
| `compareMetricSources` | assets/app.js:8444 | 22 | 1 | 3 |
| `getSheetTitles` | assets/app.js:8386 | 6 | 1 | 4 |
| `loadMarketCatalog` | assets/app.js:8701 | 12 | 1 | 5 |
| `marketFind` | assets/app.js:8717 | 2 | **ninguém** | 3 |
| `marketFlatten` | assets/app.js:8678 | 14 | 1 | 1 |
| `marketPriceFields` | assets/app.js:8692 | 9 | 1 | 2 |
| `metricLatestInfo` | assets/app.js:8429 | 15 | 1 | 6 |
| `metricRowKey` | assets/app.js:8428 | 1 | 2 | 0 |
| `metricTimeout` | assets/app.js:8466 | 6 | 1 | 1 |
| `podeSincronizarAgora` | assets/app.js:8620 | 14 | 1 | 0 |
| `readMetricsDirect` | assets/app.js:8399 | 3 | 1 | 0 |
| `readMetricSheet` | assets/app.js:8392 | 7 | 1 | 5 |
| `readMetricsWithoutPopup` | assets/app.js:8491 | 32 | 1 | 9 |
| `recoverMetricsAutomatically` | assets/app.js:8523 | 1 | 1 | 0 |
| `refreshMetricServerConfig` | assets/app.js:8425 | 3 | 1 | 1 |
| `renderMarket` | assets/app.js:8719 | 14 | 2 | 11 |
| `requestServerMetricSync` | assets/app.js:8654 | 1 | 1 | 0 |
| `runMetricAutoRecovery` | assets/app.js:8602 | 1 | 1 | 0 |
| `saveMetricSource` | assets/app.js:8667 | 4 | 1 | 4 |
| `sheetsFetch` | assets/app.js:8356 | 10 | 4 | 1 |
| `startMetricAutoRecovery` | assets/app.js:8638 | 16 | 1 | 3 |
| `stopMetricAutoRecovery` | assets/app.js:8634 | 4 | 2 | 0 |

## CDS CONFIRMADAS / GROUPS REMOVIDOS · 07/09/2026

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `cleanProfileValue` | assets/app.js:9346 | 1 | 2 | 0 |
| `profileCoordLike` | assets/app.js:9339 | 1 | 1 | 0 |
| `sourceToGroupPatch` | assets/app.js:9347 | 81 | 2 | 9 |
| `splitCoordPair` | assets/app.js:9340 | 6 | 1 | 2 |
| `updateOfficialGroupProfiles` | assets/app.js:9428 | 32 | 1 | 11 |

## CENTRAL DE COMANDO + PERFIL DE FACÇÃO EM PÁGINA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `activityButtons` | assets/app.js:12596 | 13 | 3 | 2 |
| `alExp` | assets/app.js:11938 | 1 | 1 | 0 |
| `allSegmentNames` | assets/app.js:12550 | 5 | 1 | 5 |
| `alTab` | assets/app.js:11937 | 1 | 1 | 0 |
| `anuncioFabricacao` | assets/app.js:12243 | 7 | 1 | 4 |
| `anuncioSegmentoKey` | assets/app.js:12241 | 1 | 2 | 1 |
| `anuncioSegmentoNome` | assets/app.js:12242 | 1 | 1 | 1 |
| `applyCoreSegmentMap` | assets/app.js:12827 | 31 | 1 | 6 |
| `assignSegment` | assets/app.js:12750 | 48 | 1 | 12 |
| `availableAnnouncementText` | assets/app.js:12250 | 28 | 5 | 6 |
| `availableDiscordState` | assets/app.js:12364 | 10 | 9 | 1 |
| `availablePosted` | assets/app.js:12374 | 1 | 1 | 2 |
| `beginEditSegment` | assets/app.js:12677 | 9 | 1 | 6 |
| `buildCraftRequestText` | assets/app.js:12008 | 1 | 1 | 0 |
| `closeCraftRequestModal` | assets/app.js:12085 | 1 | 1 | 1 |
| `closeOrganizationProfilePage` | assets/app.js:11799 | 1 | 1 | 1 |
| `craftRecipeKey` | assets/app.js:11990 | 1 | 1 | 0 |
| `createSegment` | assets/app.js:12686 | 64 | 1 | 15 |
| `dashboardGo` | assets/app.js:11875 | 1 | 1 | 1 |
| `deleteSegment` | assets/app.js:12798 | 28 | 1 | 16 |
| `downloadFreeFacCsv` | assets/app.js:12502 | 30 | 1 | 7 |
| `farmItemKey` | assets/app.js:11991 | 1 | 1 | 0 |
| `freeFaccoesForReport` | assets/app.js:12483 | 6 | 3 | 3 |
| `freeFacReportText` | assets/app.js:12489 | 13 | 2 | 6 |
| `gkF` | assets/app.js:11868 | 1 | 1 | 6 |
| `inconsistenciasV14` | assets/app.js:11891 | 1 | 2 | 1 |
| `ingredientDisplay` | assets/app.js:11992 | 1 | 1 | 0 |
| `isLaundryMachineRecipe` | assets/app.js:12002 | 1 | 1 | 0 |
| `isoDay` | assets/app.js:11810 | 1 | 3 | 1 |
| `openCraftRequestModal` | assets/app.js:12071 | 14 | 1 | 2 |
| `openMetricForGroup` | assets/app.js:11876 | 13 | 1 | 8 |
| `painelDepsV14` | assets/app.js:11892 | 9 | 2 | 16 |
| `persistCurrentTechProfile` | assets/app.js:12102 | 1 | 1 | 1 |
| `refreshSegmentAssignEntities` | assets/app.js:12632 | 12 | 2 | 8 |
| `renderAvailableFaccoes` | assets/app.js:12375 | 57 | 13 | 19 |
| `renderAvailableSegmentCards` | assets/app.js:12586 | 10 | 1 | 5 |
| `renderCommandDashboard` | assets/app.js:11901 | 76 | 7 | 38 |
| `renderFacActivityButtonsLegacy` | assets/app.js:12609 | 9 | **ninguém** | 2 |
| `renderOrgActivityButtons` | assets/app.js:12618 | 9 | 1 | 2 |
| `renderSegmentAdmin` | assets/app.js:12644 | 14 | 4 | 12 |
| `renderVisualSegmentFilter` | assets/app.js:12559 | 1 | 2 | 2 |
| `rowAno` | assets/app.js:11945 | 1 | 1 | 5 |
| `rowWeek` | assets/app.js:11944 | 1 | 1 | 4 |
| `same` | assets/app.js:11827 | 3 | 5 | 2 |
| `saveAvailableContingent` | assets/app.js:12318 | 46 | 1 | 8 |
| `saveAvailableImageLink` | assets/app.js:12279 | 39 | 1 | 6 |
| `saveSegmentRegistry` | assets/app.js:12658 | 17 | 2 | 9 |
| `segmentCardMarkup` | assets/app.js:12555 | 4 | 1 | 6 |
| `segmentUsage` | assets/app.js:12629 | 3 | 2 | 6 |
| `segmentVisual` | assets/app.js:12547 | 3 | 1 | 3 |
| `setAvailableDiscordState` | assets/app.js:12432 | 48 | 5 | 10 |
| `showFreeFacReport` | assets/app.js:12532 | 11 | 1 | 11 |
| `showOrganizationProfilePage` | assets/app.js:11781 | 1 | 1 | 0 |
| `startOfWeekMonday` | assets/app.js:11802 | 8 | 3 | 1 |
| `toggleAvailablePosted` | assets/app.js:12480 | 2 | **ninguém** | 4 |
| `vacantMetricAnomalies` | assets/app.js:11857 | 18 | 2 | 11 |
| `weeklyContingentAlerts` | assets/app.js:11811 | 46 | 1 | 10 |

## CENTRAL DE SOLICITAÇÕES · PADRÕES OFICIAIS HIGH

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `allRequestModels` | assets/app.js:3930 | 2 | 1 | 0 |
| `applyRouteRequestToProfile` | assets/app.js:3992 | 74 | 1 | 16 |
| `buildRequestText` | assets/app.js:3457 | 399 | 2 | 12 |
| `cds` | assets/app.js:4138 | 1 | 18 | 1 |
| `coordenada` | assets/app.js:4139 | 4 | 6 | 1 |
| `copyRequestText` | assets/app.js:4211 | 41 | 2 | 13 |
| `defaultSubject` | assets/app.js:3384 | 39 | 6 | 0 |
| `fmtCds` | assets/app.js:3452 | 1 | 5 | 0 |
| `getDetailBlock` | assets/app.js:3434 | 18 | 2 | 3 |
| `getDetailValue` | assets/app.js:3424 | 10 | 3 | 3 |
| `initRequestUi` | assets/app.js:3339 | 35 | 1 | 12 |
| `loadRequests` | assets/app.js:3889 | 41 | 1 | 13 |
| `manualRequestMutation` | assets/app.js:4131 | 1 | 1 | 0 |
| `newPair` | assets/app.js:4143 | 1 | 1 | 1 |
| `openRequestModal` | assets/app.js:3862 | 26 | 5 | 8 |
| `pushObs` | assets/app.js:3454 | 2 | 1 | 2 |
| `renderRequests` | assets/app.js:3932 | 27 | 3 | 10 |
| `requestRoutePoints` | assets/app.js:3959 | 10 | 2 | 4 |
| `requestTypeName` | assets/app.js:3374 | 1 | 7 | 1 |
| `saveRequestModel` | assets/app.js:4068 | 63 | 1 | 8 |
| `slug` | assets/app.js:4252 | 1 | 3 | 1 |
| `syncRequestFaction` | assets/app.js:3382 | 2 | 3 | 3 |
| `syncRouteRequestAction` | assets/app.js:3969 | 23 | 2 | 2 |
| `updateRequestGroupOptions` | assets/app.js:3375 | 7 | 2 | 4 |
| `updateRequestPreview` | assets/app.js:3857 | 4 | 2 | 2 |
| `upGarage` | assets/app.js:4144 | 12 | 1 | 2 |

## Chat e chamadas

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `teamOptions` | assets/modules/acoes-planejador-ui.js:361 | 6 | 1 | 6 |

## Dashboard

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `alertStateId` | assets/app.js:241 | 1 | 2 | 1 |
| `dashboardHealth` | assets/app.js:139 | 5 | 1 | 1 |
| `loadDashboardAlertStates` | assets/app.js:196 | 1 | 1 | 0 |
| `loadDashboardConfig` | assets/app.js:118 | 1 | 2 | 0 |
| `renderDashboardConfigAdmin` | assets/app.js:144 | 15 | 2 | 4 |

## DOCUMENTO DAS FACÇÕES ↔ GOOGLE SHEETS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `blipsChangedFieldsByGroup` | assets/app.js:11677 | 11 | 2 | 3 |
| `facSheetApplyConfirmed` | assets/app.js:11635 | 42 | 1 | 10 |
| `facSheetAuthorize` | assets/app.js:11529 | 18 | 4 | 3 |
| `facSheetCheckForChanges` | assets/app.js:11611 | 16 | 1 | 8 |
| `facSheetClean` | assets/app.js:11492 | 1 | 2 | 0 |
| `facSheetComparable` | assets/app.js:11493 | 3 | 1 | 3 |
| `facSheetDiffForRecord` | assets/app.js:11592 | 19 | 1 | 5 |
| `facSheetFetch` | assets/app.js:11547 | 3 | 3 | 0 |
| `facSheetNorm` | assets/app.js:11489 | 1 | 4 | 1 |
| `facSheetPatchFromRow` | assets/app.js:11508 | 12 | 1 | 3 |
| `facSheetPushAll` | assets/app.js:11741 | 15 | 1 | 7 |
| `facSheetReadAll` | assets/app.js:11574 | 1 | 2 | 0 |
| `facSheetRenderStatus` | assets/app.js:11520 | 7 | 5 | 2 |
| `facSheetResolveTitle` | assets/app.js:11562 | 12 | 2 | 5 |
| `facSheetRowFromGroup` | assets/app.js:11496 | 1 | 1 | 0 |
| `facSheetSetLastCheck` | assets/app.js:11527 | 2 | 2 | 2 |
| `facSheetStatus` | assets/app.js:11490 | 2 | 2 | 1 |
| `renderFacSheetDiffModal` | assets/app.js:11627 | 8 | 1 | 7 |
| `syncBlipsGroups` | assets/app.js:11688 | 1 | 3 | 0 |
| `syncGroupsToOfficialSheet` | assets/app.js:11706 | 2 | 3 | 0 |

## Economia · mercado negro

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `market` | assets/modules/economia-visual.js:15 | 1 | 7 | 1 |

## ECONOMIA DE COTA DAS METRICAS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyMetricSnapshot` | assets/app.js:7086 | 1 | 1 | 0 |
| `ensureMetricQuotaPanel` | assets/app.js:7116 | 5 | 1 | 0 |
| `enterQuotaMode` | assets/app.js:7032 | 21 | **ninguém** | 4 |
| `isQuotaError` | assets/app.js:7025 | 7 | **ninguém** | 1 |
| `metricReadCount` | assets/app.js:7115 | 1 | 1 | 0 |
| `metricRealtimeAtivo` | assets/app.js:7133 | 3 | **ninguém** | 0 |
| `metricRowsPendentes` | assets/app.js:7055 | 25 | **ninguém** | 3 |
| `persistMetricRows` | assets/app.js:7081 | 1 | 1 | 0 |
| `refreshMetricRealtimeCheap` | assets/app.js:7155 | 5 | 1 | 1 |
| `renderMetricQuotaPanel` | assets/app.js:7121 | 7 | 4 | 3 |
| `setMetricRealtime` | assets/app.js:7136 | 8 | **ninguém** | 3 |
| `startMetricRealtime` | assets/app.js:7160 | 11 | 3 | 3 |
| `stopMetricRealtime` | assets/app.js:7150 | 5 | 3 | 0 |

## ENTREGA COM BENEFÍCIOS DA PLANILHA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `currentDeliveryRequests` | assets/app.js:5837 | 208 | 3 | 16 |
| `deliveryBenefitState` | assets/app.js:5795 | 7 | 4 | 10 |
| `deliveryExtractV5` | assets/app.js:5808 | 29 | 2 | 7 |
| `deliveryMissingData` | assets/app.js:5802 | 6 | 1 | 7 |
| `dlvAffirmative` | assets/app.js:5214 | 1 | 1 | 3 |
| `dlvAlnum` | assets/app.js:5212 | 1 | 4 | 2 |
| `dlvCoordParts` | assets/app.js:5718 | 1 | 1 | 2 |
| `dlvCoordRows` | assets/app.js:5719 | 10 | 2 | 5 |
| `dlvFold` | assets/app.js:5211 | 1 | 8 | 1 |
| `dlvLabelKey` | assets/app.js:5249 | 1 | 1 | 1 |
| `dlvLoadSheet` | assets/app.js:5357 | 25 | 1 | 4 |
| `dlvMergedBenefits` | assets/app.js:5419 | 5 | 4 | 0 |
| `dlvNegative` | assets/app.js:5213 | 1 | 3 | 4 |
| `dlvReadOfficialTabs` | assets/app.js:5345 | 12 | 1 | 5 |
| `dlvRenderStatus` | assets/app.js:5761 | 13 | 2 | 5 |
| `dlvRenderUltraReview` | assets/app.js:5691 | 16 | 2 | 9 |
| `dlvRenderVipSheet` | assets/app.js:5496 | 24 | 2 | 9 |
| `dlvSaveVipSheet` | assets/app.js:5523 | 1 | 2 | 0 |
| `dlvSelectedVipPackage` | assets/app.js:5630 | 1 | 8 | 1 |
| `dlvSheetBenefits` | assets/app.js:5296 | 45 | 1 | 16 |
| `dlvSheetEntries` | assets/app.js:5253 | 41 | 1 | 6 |
| `dlvSnapshotForm` | assets/app.js:5707 | 6 | 2 | 2 |
| `dlvUltraAssessment` | assets/app.js:5636 | 55 | 3 | 16 |
| `dlvUltraNumber` | assets/app.js:5631 | 5 | 1 | 3 |
| `dlvVipExistingDetail` | assets/app.js:5479 | 17 | 1 | 3 |
| `dlvVipFormChanges` | assets/app.js:5520 | 3 | 1 | 2 |
| `dlvVipRead` | assets/app.js:5450 | 22 | 1 | 6 |
| `dlvVipSelect` | assets/app.js:5473 | 6 | 1 | 5 |
| `dlvVipValue` | assets/app.js:5472 | 1 | 5 | 0 |
| `fillDeliveryFromGroup` | assets/app.js:5775 | 1 | 3 | 0 |
| `item` | assets/app.js:5735 | 13 | 46 | 10 |
| `pick` | assets/app.js:5262 | 1 | 2 | 0 |
| `present` | assets/app.js:5639 | 1 | 2 | 1 |
| `recolherParaTrocaV14` | assets/app.js:6056 | 12 | 1 | 6 |
| `renderDeliveryBenefits` | assets/app.js:5729 | 31 | 2 | 18 |
| `saveNewDelivery` | assets/app.js:6068 | 116 | 1 | 28 |
| `selectedDeliveryBenefits` | assets/app.js:5792 | 1 | 2 | 2 |
| `set` | assets/app.js:5298 | 1 | 7 | 3 |
| `updateNewDeliveryPreview` | assets/app.js:6045 | 4 | 4 | 5 |

## Formatação e utilidades

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `$` | assets/app.js:51 | 1 | 501 | 0 |
| `copyText` | assets/modules/acoes-gestao-simples.js:212 | 14 | 17 | 3 |
| `escape` | assets/modules/acoes-gestao-simples.js:16 | 1 | 3 | 3 |
| `fmtBackupData` | assets/mission-planner.js:3937 | 3 | 1 | 1 |
| `fmtDateMs` | assets/modules/formatadores.js:27 | 1 | 3 | 1 |
| `fmtDuration` | assets/modules/formatadores.js:20 | 6 | 4 | 1 |
| `fmtLogDate` | assets/mission-planner.js:3245 | 1 | 4 | 1 |
| `fmtMoneyMaybe` | assets/modules/formatadores.js:29 | 4 | 2 | 4 |
| `normalizeActionName` | assets/modules/acoes-cadastro.js:7 | 1 | 6 | 1 |
| `normalizeCenter` | assets/mission-planner.js:717 | 1 | 3 | 3 |
| `normalizeMetricDate` | assets/modules/metricas-parser.js:35 | 16 | 5 | 4 |
| `normalizeMetricSlotKey` | assets/modules/metricas-parser.js:56 | 11 | 4 | 3 |
| `normalizePoint` | assets/mission-planner.js:718 | 9 | 7 | 3 |
| `normalizeText` | assets/mission-planner.js:790 | 1 | 3 | 1 |
| `normalizeZoneGeometry` | assets/mission-planner.js:561 | 5 | 1 | 1 |
| `number` | assets/modules/roubos-loot-core.js:2 | 1 | 22 | 0 |
| `numeric` | assets/modules/acoes-core.js:32 | 5 | 22 | 1 |
| `parseBulk` | assets/mission-planner.js:2435 | 1 | 1 | 5 |
| `parseCds` | assets/mission-planner.js:667 | 32 | 7 | 4 |
| `parseCsvRows` | assets/modules/metricas-parser.js:213 | 19 | 2 | 5 |
| `parseMetricNumber` | assets/modules/metricas-parser.js:52 | 3 | 3 | 2 |
| `parseMetricSheet` | assets/modules/metricas-parser.js:89 | 123 | 3 | 15 |
| `show` | assets/app.js:1183 | 4 | 5 | 2 |
| `showDecisionHistory` | assets/modules/acoes-planejador-ui.js:184 | 13 | 1 | 4 |
| `showMainRecommendation` | assets/modules/acoes-planejador-ui.js:263 | 36 | 1 | 8 |
| `showMessage` | assets/modules/acoes-npc-ui.js:98 | 4 | 2 | 2 |
| `slugify` | assets/mission-planner.js:560 | 1 | 3 | 2 |
| `togglePlannerFullscreen` | assets/mission-planner.js:2258 | 9 | 1 | 9 |
| `toggleSafeRecording` | assets/mission-planner.js:1844 | 4 | 1 | 1 |
| `toggleSafeTestPlayer` | assets/mission-planner.js:1777 | 4 | 1 | 4 |

## GESTÃO DE USUÁRIOS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyPermissionPreset` | assets/app.js:4274 | 7 | 1 | 3 |
| `assertAdmin` | assets/app.js:4310 | 2 | 4 | 0 |
| `initUsersUi` | assets/app.js:4281 | 29 | 1 | 9 |
| `loadUsers` | assets/app.js:4312 | 7 | 1 | 6 |
| `openUserModal` | assets/app.js:4342 | 13 | 2 | 5 |
| `readUserPermissions` | assets/app.js:4271 | 3 | 1 | 2 |
| `renderUserPermissionMatrix` | assets/app.js:4262 | 1 | 3 | 0 |
| `renderUsers` | assets/app.js:4319 | 23 | 4 | 11 |
| `saveUser` | assets/app.js:4355 | 26 | 1 | 15 |
| `toggleUserAccess` | assets/app.js:4381 | 16 | 1 | 8 |

## GROUP COMO PATRIMÔNIO + ENTREGA COMO VÍNCULO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `derivedOrganizations` | assets/app.js:4850 | 26 | 8 | 2 |
| `facSegmentsAvailable` | assets/app.js:4722 | 5 | 1 | 2 |
| `initDeliveryUi` | assets/app.js:4779 | 68 | 1 | 17 |
| `installedCount` | assets/app.js:4719 | 1 | 1 | 2 |
| `installedValue` | assets/app.js:4712 | 6 | 4 | 2 |
| `isInstalled` | assets/app.js:4718 | 1 | 8 | 1 |
| `loadDeliveries` | assets/app.js:5077 | 40 | 1 | 13 |
| `loadOrganizations` | assets/app.js:4876 | 9 | 1 | 7 |
| `openNewDelivery` | assets/app.js:5185 | 14 | 5 | 7 |
| `openOrganizationByName` | assets/app.js:4980 | 30 | 2 | 17 |
| `orgHistory` | assets/app.js:4962 | 18 | 1 | 7 |
| `orgKey` | assets/app.js:4849 | 1 | 11 | 3 |
| `orgSegmentsAvailable` | assets/app.js:4889 | 15 | 1 | 2 |
| `orgSegmentValue` | assets/app.js:4888 | 1 | 9 | 0 |
| `reconcileActiveDeliveriesToGroups` | assets/app.js:5117 | 50 | 1 | 5 |
| `renderDefaultDeliveryProfile` | assets/app.js:4702 | 9 | 1 | 9 |
| `renderDeliveries` | assets/app.js:5168 | 17 | 4 | 6 |
| `renderFacSegmentChips` | assets/app.js:4727 | 10 | 1 | 10 |
| `renderOrganizations` | assets/app.js:4927 | 34 | 12 | 18 |
| `renderOrgSegmentChips` | assets/app.js:4904 | 23 | 2 | 9 |
| `syncOrgOptions` | assets/app.js:4885 | 3 | 1 | 3 |
| `upsertOrganizationFromDelivery` | assets/app.js:5049 | 27 | **ninguém** | 5 |

## Groups e facções

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `faccaoOcupandoOutro` | assets/modules/ocupacao.js:49 | 4 | **ninguém** | 4 |
| `faccaoOptions` | assets/mission-planner.js:2940 | 3 | 2 | 2 |
| `faccoesAtivas` | assets/mission-planner.js:2777 | 1 | 5 | 0 |
| `factionDiscordPayload` | assets/app.js:68 | 1 | **ninguém** | 0 |
| `groupsOperacionais` | assets/modules/ocupacao.js:46 | 1 | 5 | 1 |

## HISTORICO PAGINADO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `loadHistory` | assets/app.js:6327 | 1 | 2 | 0 |
| `openRecollectEvidence` | assets/app.js:6336 | 14 | 1 | 6 |
| `renderGroupProfileMemory` | assets/app.js:6409 | 14 | 1 | 8 |
| `renderHistory` | assets/app.js:6375 | 34 | 1 | 12 |
| `renderHistoryFooter` | assets/app.js:6352 | 23 | 1 | 2 |

## LEITURA DO CADASTRO COM DIAGNOSTICO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `actionEconomyAuthorized` | assets/app.js:1697 | 1 | 3 | 2 |
| `actionMutateRegistry` | assets/app.js:1671 | 1 | 1 | 1 |
| `actionReadDecisions` | assets/app.js:1726 | 9 | 1 | 3 |
| `actionReadReference` | assets/app.js:1698 | 5 | 1 | 2 |
| `actionReadRegistry` | assets/app.js:1665 | 6 | 1 | 3 |
| `actionReadSheetPrizes` | assets/app.js:1735 | 13 | 1 | 6 |
| `actionRejectProposal` | assets/app.js:1716 | 1 | 1 | 1 |
| `actionSaveReference` | assets/app.js:1703 | 13 | 1 | 4 |
| `activateAppPage` | assets/app.js:1840 | 42 | 15 | 31 |
| `carregarCadastro` | assets/app.js:1498 | 45 | 1 | 9 |
| `carregarHtml2canvas` | assets/app.js:1489 | 1 | 2 | 1 |
| `carregarPlanejadorMissoes` | assets/app.js:1491 | 7 | 1 | 1 |
| `carregarScriptUnico` | assets/app.js:1486 | 1 | 2 | 0 |
| `closeGroupProfilePage` | assets/app.js:1900 | 1 | 1 | 1 |
| `count` | assets/app.js:1642 | 1 | 23 | 2 |
| `diaryTodayIso` | assets/app.js:1629 | 4 | 4 | 3 |
| `diaryWeekday` | assets/app.js:1633 | 3 | 2 | 1 |
| `esc` | assets/app.js:1988 | 5 | 158 | 1 |
| `g` | assets/app.js:1631 | 1 | 109 | 1 |
| `highOsDiscordWriteSelfTest` | assets/app.js:1467 | 16 | 1 | 3 |
| `loadFaccoes` | assets/app.js:1931 | 34 | 7 | 10 |
| `loadOperationalDiary` | assets/app.js:1636 | 18 | 2 | 12 |
| `recuperarTelaoIlegalMechanic02` | assets/app.js:1905 | 24 | 1 | 4 |
| `renderFaccoes` | assets/app.js:1965 | 23 | 23 | 11 |
| `showGroupProfilePage` | assets/app.js:1882 | 18 | 2 | 6 |
| `syncApprovedActionPayout` | assets/app.js:1748 | 1 | 1 | 1 |

## METRICAS SEM CUSTO DE LEITURA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `agruparPorMes` | assets/app.js:7227 | 15 | **ninguém** | 2 |
| `aplicarLinhasMetricas` | assets/app.js:7269 | 16 | 1 | 6 |
| `assinaturaMes` | assets/app.js:7242 | 10 | **ninguém** | 3 |
| `buildMetricReportHtml` | assets/app.js:7457 | 13 | 2 | 7 |
| `compactarLinhas` | assets/app.js:7215 | 6 | **ninguém** | 2 |
| `downloadMetricCsv` | assets/app.js:7487 | 24 | 1 | 8 |
| `expandirLinhas` | assets/app.js:7221 | 6 | **ninguém** | 1 |
| `lerEspelhoMensal` | assets/app.js:7264 | 4 | **ninguém** | 0 |
| `loadMetrics` | assets/app.js:7286 | 1 | 7 | 0 |
| `metricAggregateDays` | assets/app.js:7627 | 10 | 2 | 6 |
| `metricCalendarRange31` | assets/app.js:7528 | 53 | 1 | 4 |
| `metricCurrentScope` | assets/app.js:7391 | 1 | 4 | 1 |
| `metricDailyBars` | assets/app.js:7581 | 14 | 1 | 7 |
| `metricDailyCard` | assets/app.js:7646 | 11 | 1 | 4 |
| `metricDailyReportText` | assets/app.js:7701 | 20 | 1 | 11 |
| `metricDailySummary` | assets/app.js:7595 | 12 | 1 | 0 |
| `metricDateLabel` | assets/app.js:7374 | 2 | 3 | 1 |
| `metricDayAverage` | assets/app.js:7376 | 2 | 4 | 1 |
| `metricFmtDay` | assets/app.js:7645 | 1 | 1 | 1 |
| `metricGroupKey` | assets/app.js:7512 | 1 | **ninguém** | 2 |
| `metricIdentity` | assets/app.js:7325 | 10 | 6 | 4 |
| `metricMainSortValue` | assets/app.js:7749 | 9 | 1 | 2 |
| `metricMesDe` | assets/app.js:7207 | 6 | 1 | 1 |
| `metricModeValue` | assets/app.js:7381 | 3 | 1 | 0 |
| `metricPeriodRange` | assets/app.js:7378 | 3 | 2 | 3 |
| `metricReportData` | assets/app.js:7440 | 17 | 1 | 5 |
| `metricScopeTitle` | assets/app.js:7620 | 7 | 2 | 5 |
| `metricSegmentSummary` | assets/app.js:7607 | 12 | 1 | 3 |
| `metricSelectedGroup` | assets/app.js:7393 | 1 | 1 | 2 |
| `metricSnapshot` | assets/app.js:7335 | 1 | 2 | 0 |
| `metricSortLabel` | assets/app.js:7743 | 6 | 1 | 1 |
| `metricSortRows` | assets/app.js:7384 | 7 | 2 | 5 |
| `metricSummaryRows` | assets/app.js:7346 | 28 | 7 | 13 |
| `metricTimeline` | assets/app.js:7515 | 13 | 2 | 7 |
| `metricTimeMinutes` | assets/app.js:7513 | 2 | 1 | 0 |
| `metricWeekBounds` | assets/app.js:7637 | 8 | 1 | 0 |
| `metricWeekSvg` | assets/app.js:7657 | 6 | 1 | 5 |
| `name` | assets/app.js:7386 | 2 | 62 | 3 |
| `printMetricDailyReport` | assets/app.js:7721 | 5 | **ninguém** | 3 |
| `printMetricReport` | assets/app.js:7478 | 9 | 1 | 6 |
| `renderMetricExecutiveVisuals` | assets/app.js:7727 | 16 | 1 | 11 |
| `renderMetricFactionDetail` | assets/app.js:7418 | 22 | 4 | 16 |
| `renderMetricIntelligence` | assets/app.js:7664 | 37 | 1 | 12 |
| `renderMetricQuickRanking` | assets/app.js:7758 | 9 | 1 | 7 |
| `renderMetricReport` | assets/app.js:7470 | 8 | 3 | 3 |
| `salvarEspelhoMensal` | assets/app.js:7255 | 7 | 1 | 2 |
| `syncMetricSelectors` | assets/app.js:7394 | 24 | 3 | 6 |

## ORGANIZAÇÕES UNIFICADAS + ROTA PADRÃO IMPLÍCITA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `addPoint` | assets/app.js:14169 | 14 | 1 | 7 |
| `anuncioDataMs` | assets/app.js:16312 | 1 | 2 | 1 |
| `anuncioValido` | assets/app.js:16313 | 5 | 1 | 3 |
| `base` | assets/app.js:15216 | 1 | 44 | 1 |
| `c` | assets/app.js:14888 | 1 | 105 | 2 |
| `carregarAnunciosLivres` | assets/app.js:16318 | 13 | 1 | 8 |
| `cel` | assets/app.js:15323 | 1 | 2 | 3 |
| `dgAgoraBr` | assets/app.js:16108 | 1 | 2 | 3 |
| `dgCarregar` | assets/app.js:16114 | 16 | 1 | 6 |
| `dgDiaLongo` | assets/app.js:16111 | 1 | 1 | 2 |
| `dgFmtMin` | assets/app.js:16110 | 1 | 1 | 1 |
| `dgFromIso` | assets/app.js:16525 | 1 | 1 | 0 |
| `dgIso` | assets/app.js:16524 | 1 | 4 | 1 |
| `dgKind` | assets/app.js:16537 | 7 | 4 | 0 |
| `dgMin` | assets/app.js:16109 | 1 | 2 | 0 |
| `dgModoBar` | assets/app.js:16626 | 1 | 2 | 1 |
| `dgMoney` | assets/app.js:16526 | 1 | 3 | 0 |
| `dgNorm` | assets/app.js:16107 | 1 | 1 | 1 |
| `dgParseMoney` | assets/app.js:16527 | 1 | 1 | 1 |
| `dgPlaces` | assets/app.js:16544 | 9 | 4 | 7 |
| `dgRelCarregar` | assets/app.js:16553 | 4 | 1 | 1 |
| `dgRelCsv` | assets/app.js:16605 | 5 | 1 | 6 |
| `dgRelDados` | assets/app.js:16557 | 16 | 1 | 10 |
| `dgRelHtml` | assets/app.js:16583 | 22 | 1 | 13 |
| `dgRelInsights` | assets/app.js:16573 | 10 | 2 | 6 |
| `dgRelPdf` | assets/app.js:16610 | 9 | 1 | 11 |
| `dgRelRange` | assets/app.js:16528 | 8 | 2 | 5 |
| `dgRelRender` | assets/app.js:16620 | 6 | 1 | 7 |
| `dgRelShift` | assets/app.js:16536 | 1 | 1 | 3 |
| `dgRender` | assets/app.js:16139 | 34 | 2 | 14 |
| `dgShift` | assets/app.js:16112 | 1 | 1 | 2 |
| `dgStatus` | assets/app.js:16130 | 9 | 1 | 2 |
| `ensureMissionsMigrated` | assets/app.js:16263 | 3 | 1 | 0 |
| `fmt` | assets/app.js:13892 | 1 | 7 | 3 |
| `grConfirmRouteRemovalV836` | assets/app.js:13510 | 47 | 1 | 16 |
| `gsAdd` | assets/app.js:13674 | 6 | 1 | 5 |
| `gsCardCoord` | assets/app.js:14023 | 1 | 1 | 2 |
| `gsCleanRow` | assets/app.js:13990 | 4 | 1 | 1 |
| `gsCoord` | assets/app.js:13606 | 1 | 7 | 1 |
| `gsEnsureMap` | assets/app.js:13622 | 19 | 2 | 3 |
| `gsIcon` | assets/app.js:13607 | 15 | 1 | 1 |
| `gsImportArmas01` | assets/app.js:13701 | 65 | 2 | 3 |
| `gsLegacyCatalog` | assets/app.js:13813 | 1 | 1 | 0 |
| `gsMergeLegacy` | assets/app.js:13859 | 16 | 2 | 6 |
| `gsMigrateCurrent` | assets/app.js:13875 | 7 | 1 | 7 |
| `gsModalHtml` | assets/app.js:14035 | 1 | 1 | 0 |
| `gsNorm` | assets/app.js:13812 | 1 | 5 | 1 |
| `gsOpenEditor` | assets/app.js:14037 | 43 | 2 | 12 |
| `gsPersist` | assets/app.js:13994 | 25 | 2 | 10 |
| `gsRender` | assets/app.js:13658 | 16 | 9 | 15 |
| `gsRenderKpis` | assets/app.js:14024 | 5 | 1 | 7 |
| `gsRenderMap` | assets/app.js:13641 | 17 | 4 | 12 |
| `gsRequestText` | assets/app.js:13889 | 7 | 2 | 8 |
| `gsRows` | assets/app.js:13603 | 3 | 14 | 2 |
| `gsSave` | assets/app.js:13680 | 21 | 1 | 10 |
| `gsSetView` | assets/app.js:14029 | 6 | 1 | 4 |
| `gsStatusText` | assets/app.js:14019 | 4 | 2 | 0 |
| `isOperational` | assets/app.js:13445 | 4 | 1 | 6 |
| `isRegisteredAvailable` | assets/app.js:13441 | 3 | 2 | 2 |
| `key` | assets/app.js:13864 | 4 | 44 | 2 |
| `linhaVar` | assets/app.js:15573 | 1 | 1 | 4 |
| `loadOperationalDiaryV146` | assets/app.js:16173 | 8 | 1 | 7 |
| `med` | assets/app.js:16408 | 1 | 7 | 2 |
| `met` | assets/app.js:15218 | 3 | 1 | 2 |
| `mgmtAction` | assets/app.js:14859 | 6 | 3 | 1 |
| `mgmtBarSvg` | assets/app.js:14909 | 3 | 1 | 5 |
| `mgmtBuild` | assets/app.js:14814 | 44 | 5 | 10 |
| `mgmtDayKey` | assets/app.js:14781 | 1 | 2 | 1 |
| `mgmtDownloadGeneralReport` | assets/app.js:14945 | 8 | 1 | 4 |
| `mgmtEscHtml` | assets/app.js:14905 | 4 | 2 | 1 |
| `mgmtFiltered` | assets/app.js:14870 | 6 | 1 | 4 |
| `mgmtGeneralReportText` | assets/app.js:14889 | 16 | 4 | 14 |
| `mgmtLabel` | assets/app.js:14858 | 1 | 3 | 0 |
| `mgmtMedian` | assets/app.js:14810 | 4 | 1 | 1 |
| `mgmtMessage` | assets/app.js:14865 | 5 | 1 | 6 |
| `mgmtOpenGeneralReport` | assets/app.js:14940 | 5 | **ninguém** | 3 |
| `mgmtOpenMessage` | assets/app.js:14974 | 5 | 1 | 4 |
| `mgmtOpenRichReport` | assets/app.js:14933 | 7 | 2 | 2 |
| `mgmtPct` | assets/app.js:14807 | 1 | 3 | 0 |
| `mgmtPeriodStats` | assets/app.js:14787 | 20 | 1 | 7 |
| `mgmtPrintGeneralReport` | assets/app.js:14953 | 7 | 1 | 3 |
| `mgmtRichReportHtml` | assets/app.js:14912 | 21 | 1 | 18 |
| `mgmtRowsFor` | assets/app.js:14786 | 1 | 1 | 2 |
| `mgmtSegmentReport` | assets/app.js:14885 | 4 | 1 | 7 |
| `mgmtStart` | assets/app.js:14782 | 4 | 1 | 0 |
| `mgmtSummaryText` | assets/app.js:14876 | 9 | 1 | 7 |
| `mgmtTrendText` | assets/app.js:14808 | 2 | 5 | 2 |
| `missionCleanZone` | assets/app.js:16217 | 5 | 1 | 1 |
| `missionCloudErrorInfo` | assets/app.js:16232 | 19 | **ninguém** | 4 |
| `missionCloudEvent` | assets/app.js:16230 | 1 | 1 | 0 |
| `missionDocId` | assets/app.js:16210 | 6 | 2 | 2 |
| `missionEmail` | assets/app.js:16209 | 1 | 2 | 0 |
| `missionSnapToEntry` | assets/app.js:16222 | 8 | **ninguém** | 1 |
| `missionZoneRef` | assets/app.js:16216 | 1 | **ninguém** | 1 |
| `norm` | assets/app.js:15024 | 1 | 13 | 1 |
| `num` | assets/app.js:16010 | 1 | 16 | 2 |
| `ocupadoRH15` | assets/app.js:15417 | 1 | 1 | 1 |
| `org15` | assets/app.js:15162 | 2 | 11 | 0 |
| `ORG15_METRICAS` | assets/app.js:15158 | 1 | 2 | 0 |
| `ORG15_REVISAR` | assets/app.js:15159 | 1 | 1 | 2 |
| `org15Acoes` | assets/app.js:15244 | 7 | 1 | 4 |
| `org15Controles` | assets/app.js:15357 | 14 | 1 | 9 |
| `org15Csv` | assets/app.js:15322 | 6 | 5 | 4 |
| `org15DataMs` | assets/app.js:15181 | 5 | 1 | 1 |
| `org15Detalhe` | assets/app.js:15295 | 25 | 1 | 26 |
| `org15DiaBr` | assets/app.js:15178 | 1 | 3 | 0 |
| `org15DiaKey` | assets/app.js:15177 | 1 | 6 | 1 |
| `org15Dias` | assets/app.js:15176 | 1 | 4 | 0 |
| `org15ExportFreq` | assets/app.js:15334 | 10 | 2 | 14 |
| `org15ExportOrgs` | assets/app.js:15329 | 5 | 1 | 7 |
| `org15ExportPdf` | assets/app.js:15350 | 5 | 1 | 2 |
| `org15ExportResumo` | assets/app.js:15344 | 6 | 1 | 11 |
| `org15FreqCell` | assets/app.js:15238 | 6 | 1 | 8 |
| `org15GK` | assets/app.js:15160 | 1 | 10 | 4 |
| `org15Grafico` | assets/app.js:15279 | 16 | **ninguém** | 14 |
| `org15Indice` | assets/app.js:15188 | 16 | 4 | 9 |
| `org15Lista` | assets/app.js:15251 | 11 | 1 | 12 |
| `org15Mapa` | assets/app.js:15262 | 15 | 1 | 16 |
| `org15Num` | assets/app.js:15179 | 1 | 6 | 1 |
| `org15Ordenar` | assets/app.js:15214 | 15 | 3 | 8 |
| `org15Range` | assets/app.js:15169 | 7 | 4 | 3 |
| `org15Resumo` | assets/app.js:15204 | 8 | 3 | 5 |
| `org15Save` | assets/app.js:15164 | 1 | 2 | 1 |
| `org15SlotMin` | assets/app.js:15180 | 1 | 4 | 1 |
| `org15Spark` | assets/app.js:15231 | 7 | 1 | 5 |
| `org15Stamp` | assets/app.js:15328 | 1 | 3 | 1 |
| `orgV92ActionMarkup` | assets/app.js:15074 | 12 | 1 | 3 |
| `orgV92Audit` | assets/app.js:15023 | 15 | 1 | 5 |
| `orgV92Filtered` | assets/app.js:15038 | 15 | 4 | 5 |
| `orgV92HasOccupant` | assets/app.js:14993 | 1 | **ninguém** | 0 |
| `orgV92HasQG` | assets/app.js:14994 | 1 | 2 | 0 |
| `orgV92OpenReport` | assets/app.js:15126 | 15 | 2 | 13 |
| `orgV92ReportRows` | assets/app.js:15123 | 2 | 1 | 2 |
| `orgV92ReportTitle` | assets/app.js:15125 | 1 | 1 | 0 |
| `orgV92Rows` | assets/app.js:15020 | 3 | 5 | 3 |
| `orgV92Segment` | assets/app.js:15004 | 1 | 4 | 0 |
| `orgV92Status` | assets/app.js:15001 | 1 | 1 | 0 |
| `orgV92StatusClass` | assets/app.js:15003 | 1 | 2 | 0 |
| `orgV92StatusLabel` | assets/app.js:15002 | 1 | 4 | 0 |
| `pegar` | assets/app.js:15480 | 3 | 3 | 3 |
| `postarAnuncioLivre` | assets/app.js:16342 | 5 | 1 | 4 |
| `pullMissionsFromCloud` | assets/app.js:16254 | 1 | 1 | 0 |
| `renderFacActivityButtons` | assets/app.js:15053 | 15 | 1 | 2 |
| `renderIllegalManagement` | assets/app.js:14960 | 14 | 3 | 13 |
| `rgAbrir` | assets/app.js:16509 | 7 | 1 | 2 |
| `rgDados` | assets/app.js:16396 | 28 | 1 | 21 |
| `rgDiag` | assets/app.js:16382 | 14 | 1 | 5 |
| `rgGraficoRanking` | assets/app.js:16464 | 12 | 1 | 9 |
| `rgGraficoTendencia` | assets/app.js:16451 | 13 | 1 | 7 |
| `rgHeat` | assets/app.js:16476 | 4 | 1 | 6 |
| `rgHtml` | assets/app.js:16480 | 29 | 1 | 18 |
| `rgInsights` | assets/app.js:16424 | 27 | 1 | 8 |
| `rgRange` | assets/app.js:16379 | 1 | 1 | 1 |
| `rgVar` | assets/app.js:16380 | 1 | 3 | 0 |
| `rgVarHtml` | assets/app.js:16381 | 1 | 1 | 1 |
| `RH15_FACCOES` | assets/app.js:15416 | 1 | 4 | 0 |
| `RH15_METRICAS` | assets/app.js:15415 | 1 | 4 | 0 |
| `rh15AprovHtml` | assets/app.js:15532 | 1 | 1 | 3 |
| `rh15Barras` | assets/app.js:15553 | 1 | 2 | 2 |
| `rh15Base` | assets/app.js:15502 | 6 | 2 | 4 |
| `rh15BlocoGrafico` | assets/app.js:15683 | 5 | 3 | 9 |
| `rh15Br` | assets/app.js:15434 | 1 | 10 | 0 |
| `rh15CardMes` | assets/app.js:15725 | 7 | 1 | 11 |
| `rh15Coletar` | assets/app.js:15476 | 26 | 3 | 17 |
| `rh15Controles` | assets/app.js:16037 | 15 | 1 | 12 |
| `rh15Cor` | assets/app.js:15536 | 1 | **ninguém** | 1 |
| `rh15Dias` | assets/app.js:15473 | 1 | 2 | 0 |
| `rh15DiasMes` | assets/app.js:15659 | 1 | 3 | 1 |
| `rh15DK` | assets/app.js:15433 | 1 | 19 | 1 |
| `rh15Dm` | assets/app.js:15435 | 1 | 10 | 0 |
| `rh15Exportar` | assets/app.js:16014 | 21 | 1 | 18 |
| `rh15Faccao` | assets/app.js:15635 | 21 | 1 | 20 |
| `rh15Faixa` | assets/app.js:15531 | 1 | 10 | 1 |
| `rh15Filtrar` | assets/app.js:15527 | 1 | 8 | 0 |
| `rh15GraficoMes` | assets/app.js:15660 | 1 | 2 | 0 |
| `rh15Hoje` | assets/app.js:15440 | 1 | 12 | 1 |
| `rh15Imprimir` | assets/app.js:16008 | 6 | 1 | 10 |
| `rh15ImprimirGraficos` | assets/app.js:15983 | 25 | 1 | 20 |
| `rh15Iso` | assets/app.js:15441 | 1 | 1 | 1 |
| `rh15K` | assets/app.js:15432 | 1 | 6 | 2 |
| `rh15Ligar` | assets/app.js:16086 | 8 | 1 | 3 |
| `rh15Linhas` | assets/app.js:15538 | 1 | 2 | 0 |
| `rh15Meses` | assets/app.js:15453 | 5 | 1 | 5 |
| `rh15MesRot` | assets/app.js:15439 | 1 | 3 | 3 |
| `rh15Meta` | assets/app.js:15425 | 1 | 18 | 0 |
| `rh15MetaTxt` | assets/app.js:15426 | 1 | 6 | 2 |
| `rh15MiniBarras` | assets/app.js:15721 | 4 | 1 | 9 |
| `rh15N` | assets/app.js:15436 | 1 | 17 | 1 |
| `rh15Ordenar` | assets/app.js:15595 | 8 | 2 | 3 |
| `rh15Painel` | assets/app.js:15559 | 35 | 1 | 23 |
| `rh15Pct` | assets/app.js:15437 | 1 | 8 | 1 |
| `rh15Picos` | assets/app.js:15620 | 15 | 1 | 20 |
| `rh15PrintAbrir` | assets/app.js:15969 | 4 | 3 | 2 |
| `rh15PrintRodape` | assets/app.js:15977 | 1 | 4 | 0 |
| `rh15PrintSpark` | assets/app.js:15978 | 4 | 1 | 9 |
| `rh15PrintTopo` | assets/app.js:15973 | 4 | 4 | 2 |
| `rh15Range` | assets/app.js:15458 | 8 | 1 | 9 |
| `rh15RangeAnterior` | assets/app.js:15467 | 6 | 1 | 4 |
| `rh15Ranking` | assets/app.js:15603 | 17 | 1 | 12 |
| `rh15Relatorio` | assets/app.js:15860 | 11 | 1 | 8 |
| `rh15RelGraficos` | assets/app.js:15732 | 8 | 1 | 7 |
| `rh15RelLista` | assets/app.js:15657 | 1 | 2 | 1 |
| `rh15RelTabela` | assets/app.js:15871 | 40 | 2 | 20 |
| `rh15Render` | assets/app.js:16052 | 34 | 2 | 21 |
| `rh15Salvar` | assets/app.js:15429 | 1 | 2 | 0 |
| `rh15SemanaHorario` | assets/app.js:15692 | 28 | 1 | 18 |
| `rh15Situacao` | assets/app.js:15982 | 1 | 1 | 1 |
| `rh15SlotMin` | assets/app.js:15438 | 1 | 5 | 1 |
| `rh15SomaDia` | assets/app.js:15533 | 1 | 2 | 0 |
| `rh15Stats` | assets/app.js:15508 | 19 | 1 | 6 |
| `rh15TxtAssumidas` | assets/app.js:15740 | 14 | 2 | 7 |
| `rh15TxtBaixar` | assets/app.js:15833 | 13 | 1 | 3 |
| `rh15TxtCopiar` | assets/app.js:15847 | 12 | 1 | 1 |
| `rh15TxtMontar` | assets/app.js:15755 | 59 | 3 | 11 |
| `rh15TxtPainel` | assets/app.js:15815 | 17 | 1 | 10 |
| `rh15Var` | assets/app.js:15443 | 1 | 3 | 1 |
| `rh15VarTxt` | assets/app.js:15451 | 1 | 2 | 2 |
| `rh15Vazio` | assets/app.js:15911 | 1 | 7 | 2 |
| `setMode` | assets/app.js:14047 | 4 | 1 | 3 |
| `somaDia` | assets/app.js:16405 | 1 | 2 | 1 |
| `speakerRows` | assets/app.js:14315 | 1 | 1 | 0 |
| `sync` | assets/app.js:13672 | 1 | 12 | 3 |
| `syncType` | assets/app.js:14307 | 4 | 1 | 1 |
| `txtStatusErro` | assets/app.js:16078 | 1 | 1 | 0 |
| `txtStatusOK` | assets/app.js:16077 | 1 | 1 | 0 |
| `v8361CardImageUrl` | assets/app.js:13773 | 8 | 1 | 2 |
| `v836ApplyUnifiedUi` | assets/app.js:13495 | 10 | 1 | 3 |
| `v836CardImage` | assets/app.js:13431 | 2 | 2 | 4 |
| `v836Occupied` | assets/app.js:13423 | 1 | 3 | 1 |
| `v836RenderOrganizations` | assets/app.js:13433 | 58 | 1 | 26 |
| `v836RouteLabel` | assets/app.js:13427 | 4 | 1 | 3 |
| `v836RoutePoints` | assets/app.js:13424 | 3 | 2 | 4 |
| `v9010CommitStructure` | assets/app.js:14690 | 79 | 1 | 18 |
| `v908EditorHtml` | assets/app.js:14562 | 1 | 1 | 0 |
| `v909CommitStructure` | assets/app.js:14492 | 70 | 1 | 18 |
| `v9CleanRows` | assets/app.js:14199 | 8 | 4 | 2 |
| `v9Clone` | assets/app.js:14197 | 1 | 4 | 0 |
| `v9Diff` | assets/app.js:14219 | 16 | 3 | 4 |
| `v9EditorHtml` | assets/app.js:14281 | 1 | 1 | 0 |
| `v9MarkDirty` | assets/app.js:14207 | 10 | 1 | 4 |
| `v9QGCds` | assets/app.js:14217 | 2 | 1 | 3 |
| `v9SaveAll` | assets/app.js:14429 | 24 | 1 | 14 |
| `v9ShowRequest` | assets/app.js:14275 | 6 | 3 | 3 |
| `v9StructureRequest` | assets/app.js:14235 | 40 | 3 | 4 |
| `val` | assets/app.js:15217 | 1 | 14 | 1 |
| `valor` | assets/app.js:15622 | 1 | 10 | 2 |
| `vari` | assets/app.js:15597 | 1 | 3 | 0 |
| `writeMissionZone` | assets/app.js:16266 | 12 | 1 | 6 |
| `writeMissionZones` | assets/app.js:16278 | 7 | 1 | 6 |
| `x` | assets/app.js:15542 | 1 | 374 | 2 |
| `y` | assets/app.js:15283 | 1 | 90 | 0 |

## PAINEL DE SAUDE DO SISTEMA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `saudeCartao` | assets/app.js:4455 | 7 | 1 | 4 |
| `saudeTempoDesde` | assets/app.js:4436 | 10 | 1 | 3 |
| `saudeUltimaSync` | assets/app.js:4449 | 6 | 1 | 0 |
| `saudeUltimoBackup` | assets/app.js:4446 | 3 | 1 | 0 |

## PARSER DA PLANILHA OFICIAL + GOOGLE SHEETS SOMENTE LEITURA

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `a1SheetName` | assets/app.js:6771 | 1 | 1 | 3 |
| `activeMetricRows` | assets/app.js:6597 | 16 | 6 | 10 |
| `carregarTransferenciasMetricas` | assets/app.js:6588 | 3 | 1 | 2 |
| `currentMetricMonthKey` | assets/app.js:6550 | 2 | 6 | 1 |
| `extractSpreadsheetId` | assets/app.js:6758 | 13 | 4 | 2 |
| `f` | assets/app.js:6613 | 2 | 182 | 2 |
| `fetchMetricsFromSource` | assets/app.js:6963 | 3 | **ninguém** | 0 |
| `gk` | assets/app.js:6796 | 1 | 4 | 4 |
| `isPublishedSheetUrl` | assets/app.js:6719 | 4 | 2 | 0 |
| `metricActivePeriodLabel` | assets/app.js:6613 | 3 | 4 | 5 |
| `metricAnalysis` | assets/app.js:6671 | 43 | 4 | 6 |
| `metricasAtribuidas` | assets/app.js:6578 | 9 | 3 | 6 |
| `metricDateValue` | assets/app.js:6494 | 13 | 18 | 3 |
| `metricFaccaoDoGroup` | assets/app.js:6568 | 5 | 2 | 2 |
| `metricGroupOccupied` | assets/app.js:6562 | 1 | 2 | 2 |
| `metricGroupRecords` | assets/app.js:6633 | 8 | 1 | 5 |
| `metricMonthKey` | assets/app.js:6544 | 6 | 3 | 2 |
| `metricPeriodLabel` | assets/app.js:6552 | 8 | 6 | 4 |
| `metricPredominanceRange` | assets/app.js:6641 | 30 | 2 | 2 |
| `metricRowHasHistoricalOccupant` | assets/app.js:6591 | 1 | 2 | 0 |
| `metricSlotKeys` | assets/app.js:6542 | 1 | 3 | 3 |
| `metricSlotMinutes` | assets/app.js:6518 | 5 | 4 | 2 |
| `metricSlots` | assets/app.js:6523 | 19 | 22 | 2 |
| `metricTsToDate` | assets/app.js:6932 | 8 | 1 | 0 |
| `occupied` | assets/app.js:6605 | 1 | 5 | 2 |
| `parseIsoMetricDate` | assets/app.js:6560 | 2 | 4 | 1 |
| `publishedCsvUrl` | assets/app.js:6723 | 35 | 1 | 3 |
| `reatribuirMetricas` | assets/app.js:6587 | 1 | 1 | 1 |
| `refreshMetricPeriodOptions` | assets/app.js:6621 | 12 | 2 | 7 |
| `renderMetricSourceStatus` | assets/app.js:6940 | 23 | 3 | 6 |
| `syncMetricDateInputs` | assets/app.js:6616 | 4 | 2 | 1 |

## PERFIL TÉCNICO + MEMÓRIA OPERACIONAL DO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `changedSummary` | assets/app.js:6256 | 49 | 1 | 3 |
| `formatHistoryDate` | assets/app.js:6207 | 6 | 4 | 2 |
| `historyDateValue` | assets/app.js:6198 | 9 | 5 | 0 |
| `historyFamily` | assets/app.js:6220 | 16 | 3 | 0 |
| `historyMillis` | assets/app.js:6216 | 4 | 3 | 1 |
| `historyTitle` | assets/app.js:6236 | 20 | 4 | 3 |

## PERFIL TÉCNICO INTEGRADO AO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `addFarmItem` | assets/app.js:10408 | 6 | 1 | 1 |
| `addRecipe` | assets/app.js:10377 | 3 | 1 | 2 |
| `archiveTechnicalRequest` | assets/app.js:10564 | 1 | 4 | 0 |
| `canonicalProductImage` | assets/app.js:10170 | 12 | 2 | 1 |
| `clonePlain` | assets/app.js:10113 | 1 | 19 | 0 |
| `closeFarmEditor` | assets/app.js:10389 | 1 | 1 | 1 |
| `closeGroupSettingsPage` | assets/app.js:11049 | 15 | 1 | 3 |
| `closeRecipeEditor` | assets/app.js:10363 | 1 | 1 | 1 |
| `copyArchivedRequest` | assets/app.js:10607 | 6 | 1 | 1 |
| `createPromise` | assets/app.js:10577 | 23 | 1 | 5 |
| `defaultTechProfile` | assets/app.js:10244 | 1 | 1 | 0 |
| `editFarmItem` | assets/app.js:10390 | 18 | 2 | 5 |
| `editRecipe` | assets/app.js:10364 | 13 | 2 | 4 |
| `ensureBenefitsHome` | assets/app.js:11019 | 9 | 2 | 1 |
| `farmItemCard` | assets/app.js:10380 | 2 | 1 | 6 |
| `farmItemsFromCraft` | assets/app.js:10206 | 20 | 1 | 3 |
| `fmtRequestWhen` | assets/app.js:10605 | 1 | 1 | 0 |
| `getTechProfileFromForm` | assets/app.js:10313 | 23 | 4 | 4 |
| `ingredientEditorRow` | assets/app.js:10348 | 1 | 1 | 0 |
| `itemImg` | assets/app.js:10182 | 2 | 6 | 2 |
| `mergedTechProfile` | assets/app.js:10270 | 1 | 22 | 0 |
| `mergeRecipeLists` | assets/app.js:10091 | 12 | 2 | 3 |
| `opBlank` | assets/app.js:10701 | 26 | 1 | 1 |
| `openGroupSettingsPage` | assets/app.js:11028 | 21 | 1 | 7 |
| `operationalFromExisting` | assets/app.js:10750 | 1 | 1 | 0 |
| `operationalFromForm` | assets/app.js:10808 | 56 | 2 | 3 |
| `opGet` | assets/app.js:10807 | 1 | 1 | 1 |
| `opMerge` | assets/app.js:10727 | 1 | 1 | 0 |
| `opPair` | assets/app.js:10698 | 3 | 1 | 2 |
| `persistirSolicitacaoMecanicas20261019` | assets/app.js:9953 | 33 | 1 | 7 |
| `readIngredientEditor` | assets/app.js:10358 | 4 | 2 | 2 |
| `recipeCard` | assets/app.js:10336 | 2 | 1 | 6 |
| `recipeNormalize` | assets/app.js:10184 | 1 | 3 | 0 |
| `renderConnectedRequests` | assets/app.js:10613 | 17 | 5 | 11 |
| `renderCraftRecipes` | assets/app.js:10338 | 10 | 2 | 7 |
| `renderFarmItems` | assets/app.js:10382 | 7 | 4 | 5 |
| `renderIngredientEditor` | assets/app.js:10350 | 8 | 2 | 6 |
| `renderOperationalProfile` | assets/app.js:10866 | 1 | 1 | 0 |
| `renderRouteOverview` | assets/app.js:10437 | 26 | 4 | 6 |
| `renderStructureSnapshot` | assets/app.js:10470 | 32 | 2 | 9 |
| `renderTechProfile` | assets/app.js:10297 | 16 | 5 | 9 |
| `requestFingerprint` | assets/app.js:10562 | 1 | 2 | 0 |
| `routePointList` | assets/app.js:10414 | 11 | 5 | 3 |
| `segmentKey` | assets/app.js:10060 | 1 | 18 | 2 |
| `setOpVal` | assets/app.js:10864 | 2 | 2 | 2 |
| `setRouteExclusive` | assets/app.js:10425 | 12 | 1 | 4 |
| `standardRecipesForGroup` | assets/app.js:10061 | 1 | 1 | 0 |
| `syncFarmWithCraft` | assets/app.js:10226 | 18 | 4 | 2 |
| `syncOperationalLegacy` | assets/app.js:10942 | 30 | 1 | 4 |
| `techAutoRequests` | assets/app.js:10503 | 49 | 1 | 7 |
| `techChanged` | assets/app.js:10502 | 1 | **ninguém** | 1 |
| `toggleRoutePoints` | assets/app.js:10463 | 7 | 1 | 1 |

## PERMISSÕES GRANULARES POR MÓDULO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `applyModuleAccess` | assets/app.js:1418 | 17 | 2 | 9 |
| `canEditModule` | assets/app.js:1415 | 2 | 6 | 3 |
| `canViewModule` | assets/app.js:1412 | 3 | 7 | 3 |
| `defaultPermissionsForRole` | assets/app.js:1386 | 14 | 7 | 0 |
| `effectivePermissions` | assets/app.js:1400 | 11 | 3 | 3 |
| `firstAllowedModule` | assets/app.js:1417 | 1 | 2 | 1 |
| `moduleForElement` | assets/app.js:1439 | 17 | 1 | 2 |
| `mutationButton` | assets/app.js:1435 | 4 | 1 | 1 |
| `normalizePermission` | assets/app.js:1382 | 4 | 5 | 0 |
| `pageModule` | assets/app.js:1411 | 1 | 4 | 0 |
| `permissionDeniedMessage` | assets/app.js:1456 | 2 | 4 | 3 |

## Planejador de missões

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `missionComparable` | assets/mission-planner.js:878 | 1 | 2 | 1 |
| `missionTime` | assets/mission-planner.js:896 | 1 | 1 | 0 |
| `plannerAudit` | assets/mission-planner.js:2169 | 13 | 4 | 21 |
| `plannerPanel` | assets/mission-planner.js:3918 | 1 | 2 | 2 |

## RESUMO EXECUTIVO / CADASTRO RECOLHIDO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `renderGroupOverview` | assets/app.js:11071 | 30 | 1 | 7 |

## ROTA EXCLUSIVA + MAPA OPERACIONAL DO GROUP

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `grCollectStructures` | assets/app.js:13169 | 54 | 2 | 8 |
| `grCurrent` | assets/app.js:13120 | 3 | 19 | 4 |
| `grDeleteRoute` | assets/app.js:13356 | 40 | 1 | 17 |
| `grEnsureMap` | assets/app.js:13223 | 20 | 1 | 3 |
| `grFmtPoint` | assets/app.js:13118 | 1 | 5 | 1 |
| `grMapPng` | assets/app.js:13396 | 9 | 1 | 4 |
| `grParseCoord` | assets/app.js:13103 | 11 | 5 | 4 |
| `grParseRoute` | assets/app.js:13114 | 4 | 6 | 3 |
| `grRenderMap` | assets/app.js:13255 | 16 | 3 | 11 |
| `grRenderRouteUi` | assets/app.js:13281 | 15 | 5 | 11 |
| `grRenderRows` | assets/app.js:13271 | 10 | 2 | 7 |
| `grRequestText` | assets/app.js:13124 | 41 | 3 | 9 |
| `grRouteIcon` | assets/app.js:13243 | 6 | 3 | 2 |
| `grRouteText` | assets/app.js:13119 | 1 | **ninguém** | 5 |
| `grSavedPoints` | assets/app.js:13123 | 1 | 6 | 4 |
| `grSaveRoute` | assets/app.js:13307 | 49 | 1 | 24 |
| `grShowRequest` | assets/app.js:13165 | 4 | 3 | 3 |
| `grStructIcon` | assets/app.js:13249 | 6 | 1 | 1 |
| `routeActionEnd` | assets/app.js:13303 | 4 | 3 | 1 |
| `routeActionStart` | assets/app.js:13297 | 6 | 3 | 1 |
| `walk` | assets/app.js:13216 | 3 | 1 | 2 |

## Sem categoria

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `abrirRevisao` | assets/modules/painel-ocupacao.js:72 | 30 | 2 | 10 |
| `action` | assets/modules/acoes-planejador-ui.js:23 | 1 | 40 | 0 |
| `actionPhoto` | assets/modules/acoes-planejador-ui.js:210 | 3 | 2 | 1 |
| `actionsList` | assets/modules/acoes-planejador-ui.js:300 | 38 | 2 | 10 |
| `activate` | assets/mission-planner.js:4048 | 14 | 2 | 3 |
| `active` | assets/mission-planner.js:543 | 1 | 127 | 0 |
| `activeDominationPolygon` | assets/mission-planner.js:593 | 1 | 7 | 2 |
| `activeEventId` | assets/mission-planner.js:545 | 1 | 3 | 1 |
| `activities` | assets/modules/acoes-gestao-simples.js:29 | 15 | 1 | 2 |
| `actual` | assets/modules/roubos-loot-ui.js:36 | 5 | 2 | 6 |
| `actualHouseRun` | assets/modules/roubos-loot-core.js:45 | 1 | 3 | 0 |
| `addDynamicSafeStage` | assets/mission-planner.js:1646 | 8 | 1 | 8 |
| `addManual` | assets/mission-planner.js:2523 | 12 | 1 | 10 |
| `adjustText` | assets/modules/acoes-gestao-simples.js:153 | 3 | 3 | 1 |
| `adoptStrayCards` | assets/mission-planner.js:3919 | 10 | 2 | 6 |
| `alternar` | assets/mission-planner.js:1383 | 5 | 1 | 1 |
| `amount` | assets/modules/acoes-npc-core.js:5 | 1 | 3 | 0 |
| `analyze` | assets/mission-planner.js:2080 | 12 | 1 | 6 |
| `analyzeDecision` | assets/modules/acoes-inteligencia.js:53 | 4 | 6 | 2 |
| `anomalyAlertId` | assets/app.js:270 | 1 | 2 | 1 |
| `anomalyIsCleared` | assets/app.js:271 | 4 | 1 | 2 |
| `aplicar` | assets/modules/painel-ocupacao.js:103 | 15 | 5 | 3 |
| `applyCloudMissions` | assets/mission-planner.js:1036 | 3 | 1 | 2 |
| `applyFairCenter` | assets/mission-planner.js:3165 | 16 | 2 | 13 |
| `applyLayerVisibility` | assets/mission-planner.js:2267 | 3 | 1 | 0 |
| `applyOceanColor` | assets/mission-planner.js:1207 | 6 | 2 | 1 |
| `applyRadius` | assets/mission-planner.js:1972 | 1 | 1 | 6 |
| `applyRegistryMutation` | assets/modules/acoes-cadastro.js:102 | 1 | 1 | 1 |
| `applySheetPrizeOverrides` | assets/modules/acoes-inteligencia.js:114 | 11 | 2 | 2 |
| `applyZoneProposal` | assets/mission-planner.js:2002 | 1 | 1 | 5 |
| `approveProposal` | assets/modules/acoes-planejador-ui.js:571 | 40 | 1 | 16 |
| `areaFor` | assets/modules/acoes-gestao-simples.js:27 | 1 | 1 | 0 |
| `assessPriceChanges` | assets/modules/acoes-inteligencia.js:23 | 1 | 2 | 0 |
| `atribuirLinhas` | assets/modules/metricas-motor.js:150 | 1 | 2 | 0 |
| `attachMapLayerHealth` | assets/mission-planner.js:1290 | 4 | 2 | 4 |
| `autoSafe` | assets/mission-planner.js:3030 | 36 | 1 | 27 |
| `availableActions` | assets/modules/acoes-gestao-simples.js:28 | 1 | 3 | 0 |
| `availableTeams` | assets/modules/acoes-core.js:42 | 1 | 3 | 2 |
| `baixarBackup` | assets/mission-planner.js:3958 | 9 | 1 | 1 |
| `baselineOfficialZones` | assets/mission-planner.js:3335 | 8 | 2 | 4 |
| `beginSafePlacement` | assets/mission-planner.js:1629 | 6 | 1 | 6 |
| `bind` | assets/mission-planner.js:3869 | 13 | 2 | 54 |
| `bindFormAutosave` | assets/mission-planner.js:3839 | 4 | 1 | 18 |
| `blankAction` | assets/modules/acoes-cadastro.js:9 | 5 | 2 | 0 |
| `blippedActions` | assets/modules/acoes-planejador-ui.js:24 | 1 | 3 | 0 |
| `buildActionRankings` | assets/modules/acoes-ranking.js:38 | 1 | 2 | 0 |
| `buildEventPackage` | assets/mission-planner.js:3595 | 59 | 1 | 17 |
| `buildLayerControl` | assets/mission-planner.js:1340 | 52 | 1 | 10 |
| `buildManagementBoard` | assets/modules/acoes-gestao.js:25 | 4 | 3 | 0 |
| `byName` | assets/modules/acoes-gestao.js:14 | 1 | 1 | 0 |
| `calc` | assets/modules/acoes-gestao-simples.js:84 | 46 | 5 | 20 |
| `calculateAction` | assets/modules/acoes-core.js:103 | 1 | 7 | 0 |
| `calibrationModelAt` | assets/mission-planner.js:1597 | 8 | 1 | 4 |
| `calibrationReferences` | assets/mission-planner.js:1593 | 4 | 1 | 0 |
| `cancelEdit` | assets/mission-planner.js:2367 | 2 | 5 | 7 |
| `cancelZoneSent` | assets/mission-planner.js:3367 | 11 | 1 | 2 |
| `canMarkRequests` | assets/mission-planner.js:2684 | 1 | 13 | 1 |
| `capacityWarning` | assets/mission-planner.js:2747 | 6 | 2 | 3 |
| `caption` | assets/modules/acoes-gestao-simples.js:149 | 4 | 1 | 1 |
| `captureSnapshot` | assets/mission-planner.js:2396 | 18 | 3 | 8 |
| `card` | assets/modules/economia-visual.js:62 | 1 | 48 | 3 |
| `cardTabKey` | assets/mission-planner.js:3909 | 9 | 2 | 1 |
| `CATALOG` | assets/mission-planner.js:2676 | 1 | 12 | 0 |
| `categoryOf` | assets/modules/acoes-core.js:21 | 9 | 1 | 3 |
| `cdsFormatHint` | assets/mission-planner.js:2436 | 4 | 1 | 0 |
| `cdsProblemas` | assets/mission-planner.js:699 | 2 | 3 | 0 |
| `cell` | assets/modules/blips-sheet-sync.js:50 | 1 | 7 | 3 |
| `centerReadyFor` | assets/mission-planner.js:3246 | 1 | 2 | 2 |
| `centralCategory` | assets/mission-planner.js:3770 | 1 | 1 | 0 |
| `cents` | assets/modules/acoes-core.js:31 | 1 | 1 | 1 |
| `changeField` | assets/modules/acoes-gestao-simples.js:202 | 10 | 1 | 6 |
| `chave` | assets/modules/metricas-motor.js:28 | 1 | 7 | 1 |
| `chaveGroup` | assets/modules/metricas-motor.js:30 | 1 | 4 | 3 |
| `checksHtml` | assets/mission-planner.js:3683 | 5 | 1 | 6 |
| `chip` | assets/modules/acoes-planejador-ui.js:63 | 1 | 17 | 1 |
| `choose` | assets/modules/acoes-planejador-ui.js:64 | 4 | 2 | 5 |
| `chooseActivity` | assets/modules/acoes-gestao-simples.js:194 | 8 | 1 | 2 |
| `chosenHouseItem` | assets/modules/acoes-gestao-simples.js:63 | 6 | 2 | 3 |
| `clamp` | assets/modules/acoes-core.js:30 | 1 | 2 | 1 |
| `cleanActionEntry` | assets/modules/acoes-cadastro.js:14 | 1 | 1 | 1 |
| `cleanNpcProducts` | assets/modules/acoes-cadastro.js:71 | 17 | 1 | 5 |
| `cleanRegistry` | assets/modules/acoes-cadastro.js:53 | 18 | 6 | 3 |
| `cleanSegmentName` | assets/app.js:342 | 1 | 2 | 0 |
| `cleanupSafePresentation` | assets/mission-planner.js:2579 | 6 | 6 | 2 |
| `clearEditDraft` | assets/mission-planner.js:2275 | 1 | 3 | 0 |
| `clearLayers` | assets/mission-planner.js:1474 | 1 | 1 | 1 |
| `clearPoints` | assets/mission-planner.js:2663 | 1 | 1 | 3 |
| `clearSafeBots` | assets/mission-planner.js:1781 | 1 | 2 | 0 |
| `clearSafeHover` | assets/mission-planner.js:1617 | 4 | 2 | 0 |
| `clearVacantMetricAlert` | assets/app.js:275 | 25 | 1 | 8 |
| `cloneEventTo` | assets/mission-planner.js:2653 | 6 | 1 | 13 |
| `cloneFacXFacAsSurvival` | assets/mission-planner.js:2646 | 7 | 1 | 12 |
| `cloneZone` | assets/mission-planner.js:2641 | 5 | 1 | 9 |
| `close` | assets/mission-planner.js:2634 | 1 | 16 | 0 |
| `closeEditor` | assets/modules/acoes-workspace.js:136 | 4 | 2 | 1 |
| `closingText` | assets/mission-planner.js:3456 | 9 | 2 | 6 |
| `cloudSummary` | assets/mission-planner.js:895 | 1 | 2 | 1 |
| `cloudUser` | assets/mission-planner.js:2683 | 1 | 6 | 0 |
| `cnt` | assets/mission-planner.js:3797 | 1 | 2 | 0 |
| `col` | assets/mission-planner.js:3139 | 1 | 10 | 0 |
| `coletaDoDia` | assets/modules/metricas-motor.js:226 | 1 | 3 | 0 |
| `collect` | assets/modules/acoes-npc-ui.js:21 | 11 | 2 | 5 |
| `collectRows` | assets/modules/acoes-workspace.js:98 | 10 | 2 | 4 |
| `combinePublished` | assets/modules/acoes-planejador-ui.js:32 | 2 | 5 | 1 |
| `commit` | assets/mission-planner.js:2357 | 5 | 27 | 9 |
| `completeSpawns` | assets/mission-planner.js:2870 | 32 | 1 | 26 |
| `confirmPolygonBulk` | assets/mission-planner.js:2012 | 1 | 1 | 2 |
| `copyCurrentRequest` | assets/mission-planner.js:3761 | 1 | 1 | 4 |
| `copyProposal` | assets/modules/acoes-planejador-ui.js:526 | 27 | 1 | 9 |
| `copySelectedTp` | assets/mission-planner.js:2515 | 8 | 1 | 7 |
| `copySuricato` | assets/modules/acoes-planejador-ui.js:553 | 18 | 1 | 4 |
| `costUnit` | assets/modules/roubos-loot-ui.js:19 | 1 | 3 | 1 |
| `coverageStats` | assets/mission-planner.js:631 | 17 | 5 | 2 |
| `coverRadius` | assets/mission-planner.js:3150 | 5 | 2 | 2 |
| `coverSpawns` | assets/mission-planner.js:3155 | 10 | 1 | 11 |
| `cr` | assets/mission-planner.js:617 | 1 | 12 | 2 |
| `createActionWorkspace` | assets/modules/acoes-workspace.js:10 | 1 | 1 | 0 |
| `createEconomyVisual` | assets/modules/economia-visual.js:6 | 1 | 1 | 0 |
| `createEvent` | assets/mission-planner.js:2535 | 7 | 1 | 10 |
| `createHouseWorkbench` | assets/modules/roubos-loot-ui.js:6 | 1 | 1 | 0 |
| `createNpcWorkbench` | assets/modules/acoes-npc-ui.js:5 | 1 | 1 | 0 |
| `createSimpleEconomyPanel` | assets/modules/acoes-gestao-simples.js:8 | 1 | 1 | 0 |
| `createZone` | assets/mission-planner.js:2542 | 10 | 2 | 15 |
| `cs` | assets/modules/acoes-planejador-ui.js:443 | 1 | 3 | 0 |
| `csvCell` | assets/modules/acoes-planejador-ui.js:628 | 1 | 2 | 0 |
| `current` | assets/modules/acoes-workspace.js:17 | 1 | 18 | 1 |
| `currentStep` | assets/mission-planner.js:3899 | 1 | 2 | 1 |
| `dcTag` | assets/modules/painel-ocupacao.js:40 | 1 | 1 | 0 |
| `decimal` | assets/modules/roubos-loot-ui.js:48 | 1 | 2 | 0 |
| `decision` | assets/modules/acoes-planejador-ui.js:27 | 5 | 6 | 4 |
| `defaultActivity` | assets/modules/acoes-gestao-simples.js:52 | 7 | 1 | 2 |
| `defaultPanel` | assets/mission-planner.js:2682 | 1 | 5 | 1 |
| `defaultTeam` | assets/modules/acoes-core.js:43 | 1 | 10 | 2 |
| `definirGroupsConhecidos` | assets/modules/metricas-parser.js:18 | 3 | 1 | 0 |
| `deleteEvent` | assets/mission-planner.js:2587 | 13 | 1 | 11 |
| `deleteZone` | assets/mission-planner.js:2586 | 1 | 1 | 11 |
| `deleteZonesSynced` | assets/mission-planner.js:1001 | 24 | 2 | 12 |
| `descartarColetasVazias` | assets/modules/metricas-motor.js:196 | 1 | 2 | 0 |
| `det` | assets/mission-planner.js:3137 | 1 | 4 | 0 |
| `diarioDoEvento` | assets/mission-planner.js:2951 | 6 | 3 | 6 |
| `diarioEventos` | assets/mission-planner.js:2946 | 5 | 3 | 2 |
| `diarioId` | assets/mission-planner.js:2945 | 1 | 3 | 1 |
| `dias` | assets/modules/painel-ocupacao.js:41 | 1 | 52 | 1 |
| `diasVago` | assets/modules/ocupacao.js:66 | 1 | 2 | 0 |
| `diffText` | assets/mission-planner.js:2733 | 8 | 2 | 4 |
| `discordId` | assets/app.js:76 | 1 | 1 | 0 |
| `distributionText` | assets/mission-planner.js:3437 | 9 | 2 | 1 |
| `distXY` | assets/mission-planner.js:708 | 1 | 9 | 0 |
| `dominationAccessAnalysis` | assets/mission-planner.js:2146 | 8 | 3 | 9 |
| `dominationAccessDistance` | assets/mission-planner.js:2141 | 1 | 2 | 5 |
| `dominationAccessTarget` | assets/mission-planner.js:2143 | 1 | 1 | 7 |
| `dominationAnalysisCenter` | assets/mission-planner.js:597 | 1 | 2 | 6 |
| `dominationFairnessAnalysis` | assets/mission-planner.js:2154 | 7 | 2 | 4 |
| `dominationFairnessWarnings` | assets/mission-planner.js:2161 | 7 | 2 | 3 |
| `dominationPolygon` | assets/mission-planner.js:591 | 1 | 13 | 1 |
| `dominationPolygonAudit` | assets/mission-planner.js:603 | 27 | 3 | 17 |
| `dominationZoneGeometry` | assets/mission-planner.js:599 | 1 | 10 | 5 |
| `dominationZoneMode` | assets/mission-planner.js:592 | 1 | 14 | 1 |
| `draw` | assets/mission-planner.js:2963 | 44 | 2 | 29 |
| `drawCompareOverlay` | assets/mission-planner.js:1475 | 14 | 1 | 10 |
| `drawDominationAccess` | assets/mission-planner.js:2144 | 1 | 1 | 3 |
| `drawElevationKnowledge` | assets/mission-planner.js:1848 | 13 | 1 | 9 |
| `drawLocSuggestions` | assets/mission-planner.js:3100 | 10 | 1 | 8 |
| `drawSafeRoute` | assets/mission-planner.js:1706 | 9 | 1 | 8 |
| `drawZoneProposal` | assets/mission-planner.js:2000 | 1 | 1 | 1 |
| `duplicateMission` | assets/mission-planner.js:2659 | 4 | **ninguém** | 2 |
| `duracaoAlvo` | assets/mission-planner.js:3022 | 1 | 3 | 1 |
| `edgeLabel` | assets/mission-planner.js:619 | 1 | 1 | 2 |
| `editorRows` | assets/modules/acoes-workspace.js:81 | 17 | 2 | 6 |
| `editSnapshot` | assets/mission-planner.js:2348 | 1 | 8 | 1 |
| `effectiveEventRadius` | assets/mission-planner.js:648 | 3 | 36 | 2 |
| `el` | assets/modules/acoes-planejador-ui.js:7 | 1 | 67 | 0 |
| `elevationSamples` | assets/mission-planner.js:1572 | 7 | 2 | 7 |
| `elRows` | assets/modules/acoes-npc-ui.js:20 | 1 | 2 | 0 |
| `emptyMarket` | assets/modules/acoes-cadastro.js:52 | 1 | 2 | 0 |
| `enablePublishedPriceChecks` | assets/modules/acoes-planejador-ui.js:198 | 9 | 1 | 3 |
| `ensureBackupCard` | assets/mission-planner.js:3981 | 18 | 1 | 6 |
| `ensureCenterValidationUi` | assets/mission-planner.js:1943 | 8 | 1 | 9 |
| `ensureCentralV954` | assets/mission-planner.js:3763 | 7 | 2 | 1 |
| `ensureCoverageUi` | assets/mission-planner.js:1965 | 27 | 1 | 21 |
| `ensureDominationPolygonUi` | assets/mission-planner.js:2004 | 19 | 2 | 31 |
| `ensureEventKindUi` | assets/mission-planner.js:3744 | 10 | 1 | 10 |
| `ensureMapKpis` | assets/mission-planner.js:4042 | 6 | 1 | 2 |
| `ensurePlannerTabs` | assets/mission-planner.js:3999 | 29 | 1 | 7 |
| `ensurePreviewHud` | assets/mission-planner.js:1725 | 5 | 1 | 1 |
| `ensureRequestStatusUi` | assets/mission-planner.js:3688 | 5 | 2 | 2 |
| `ensureSafeRoute` | assets/mission-planner.js:1491 | 19 | 26 | 5 |
| `ensureSafeRouteUi` | assets/mission-planner.js:1605 | 8 | 4 | 10 |
| `ensureSafeTimeline` | assets/mission-planner.js:1808 | 9 | 1 | 7 |
| `ensureWorkspaceBar` | assets/mission-planner.js:3858 | 7 | 1 | 7 |
| `estimateElevation` | assets/mission-planner.js:1579 | 10 | 4 | 4 |
| `estimateZ` | assets/mission-planner.js:2112 | 13 | 3 | 5 |
| `eventCapacities` | assets/mission-planner.js:2746 | 1 | 3 | 2 |
| `eventInsights` | assets/mission-planner.js:2928 | 12 | 4 | 7 |
| `eventOptions` | assets/mission-planner.js:2623 | 1 | 2 | 3 |
| `eventProfiles` | assets/mission-planner.js:2600 | 20 | 2 | 2 |
| `eventsOfCategory` | assets/mission-planner.js:550 | 10 | 5 | 1 |
| `eventTarget` | assets/mission-planner.js:2778 | 5 | 4 | 3 |
| `eventTypeOf` | assets/mission-planner.js:2677 | 5 | 21 | 2 |
| `eventUid` | assets/mission-planner.js:544 | 1 | 5 | 0 |
| `evStages` | assets/mission-planner.js:3798 | 1 | 2 | 2 |
| `exitSafePresentation` | assets/mission-planner.js:1747 | 4 | 2 | 7 |
| `exportAnalysis` | assets/modules/acoes-planejador-ui.js:648 | 19 | 1 | 7 |
| `exportManagement` | assets/modules/acoes-planejador-ui.js:629 | 18 | 1 | 6 |
| `exportMission` | assets/mission-planner.js:2250 | 8 | 1 | 13 |
| `exportValidated` | assets/mission-planner.js:2665 | 2 | 1 | 7 |
| `exportXY` | assets/mission-planner.js:2667 | 1 | 1 | 7 |
| `extractPublishedActionPrizes` | assets/modules/acoes-sheet-sync.js:64 | 29 | 2 | 9 |
| `fairCenterOf` | assets/mission-planner.js:3130 | 19 | 3 | 8 |
| `field` | assets/modules/economia-visual.js:14 | 1 | 27 | 2 |
| `fieldSelect` | assets/modules/acoes-gestao-simples.js:69 | 4 | 1 | 5 |
| `filterManagementEntries` | assets/modules/acoes-gestao.js:114 | 1 | 2 | 0 |
| `findDashboardAlertState` | assets/app.js:242 | 1 | 2 | 2 |
| `findSector` | assets/modules/blips-sheet-sync.js:159 | 1 | 1 | 1 |
| `finite` | assets/modules/acoes-cadastro.js:8 | 1 | 2 | 0 |
| `first` | assets/modules/blips-sheet-sync.js:51 | 1 | 9 | 1 |
| `fit` | assets/mission-planner.js:2418 | 1 | 9 | 5 |
| `fitSafeRouteForPresentation` | assets/mission-planner.js:1730 | 4 | 1 | 4 |
| `fitZone` | assets/mission-planner.js:2061 | 6 | 4 | 6 |
| `flush` | assets/mission-planner.js:1878 | 1 | 1 | 2 |
| `focusActiveMission` | assets/mission-planner.js:2570 | 9 | 5 | 7 |
| `focusSafePreflight` | assets/mission-planner.js:2207 | 5 | **ninguém** | 6 |
| `focusSafeStage` | assets/mission-planner.js:1686 | 6 | 2 | 3 |
| `focusSpawnProblems` | assets/mission-planner.js:1918 | 3 | 1 | 6 |
| `fold` | assets/modules/blips-sheet-sync.js:13 | 3 | 6 | 2 |
| `forcePlannerCloudSync` | assets/mission-planner.js:1047 | 17 | 1 | 11 |
| `formatDuration` | assets/mission-planner.js:1533 | 1 | 7 | 0 |
| `fullCost` | assets/modules/roubos-loot-ui.js:18 | 1 | 2 | 1 |
| `gameGeom` | assets/mission-planner.js:2712 | 1 | 1 | 0 |
| `garage` | assets/modules/blips-sheet-sync.js:63 | 1 | 1 | 2 |
| `generateCircle` | assets/mission-planner.js:2419 | 16 | 2 | 11 |
| `generateInsideZone` | assets/mission-planner.js:2067 | 12 | 1 | 9 |
| `generateRequest` | assets/mission-planner.js:3530 | 1 | 4 | 0 |
| `geomDiff` | assets/mission-planner.js:2713 | 20 | 2 | 5 |
| `geomHash` | assets/mission-planner.js:2698 | 5 | 5 | 6 |
| `geomSnap` | assets/mission-planner.js:2708 | 4 | 5 | 6 |
| `getRules` | assets/modules/acoes-core.js:37 | 5 | 4 | 2 |
| `getSnapshot` | assets/mission-planner.js:1163 | 3 | 1 | 1 |
| `goStep` | assets/mission-planner.js:3908 | 1 | 1 | 5 |
| `goValidate` | assets/mission-planner.js:1933 | 1 | 1 | 2 |
| `hasDynamicSafe` | assets/mission-planner.js:1490 | 1 | 11 | 0 |
| `hashText` | assets/mission-planner.js:2685 | 1 | 2 | 0 |
| `headingIcon` | assets/mission-planner.js:1468 | 6 | 1 | 2 |
| `heightIssues` | assets/mission-planner.js:3067 | 8 | 2 | 3 |
| `heightText` | assets/mission-planner.js:3447 | 7 | 2 | 3 |
| `highOsDiscordRequest` | assets/app.js:59 | 1 | 10 | 0 |
| `highOsStoreDelete` | assets/app.js:75 | 1 | 3 | 1 |
| `highOsStoreGet` | assets/app.js:73 | 1 | 8 | 1 |
| `highOsStoreList` | assets/app.js:72 | 1 | 13 | 2 |
| `highOsStorePut` | assets/app.js:74 | 1 | 8 | 1 |
| `highRequestExport` | assets/mission-planner.js:2223 | 23 | 1 | 17 |
| `hojeBR` | assets/modules/ocupacao.js:71 | 3 | **ninguém** | 1 |
| `houseItems` | assets/modules/acoes-gestao-simples.js:59 | 4 | 6 | 0 |
| `houseLootScenario` | assets/modules/acoes-npc-core.js:19 | 1 | 1 | 0 |
| `houseRunMetrics` | assets/modules/roubos-loot-core.js:55 | 7 | 2 | 2 |
| `houseSearchParts` | assets/modules/roubos-loot-core.js:126 | 5 | 3 | 2 |
| `hullArea` | assets/mission-planner.js:617 | 1 | 1 | 5 |
| `hydrate` | assets/modules/acoes-npc-ui.js:14 | 6 | 2 | 4 |
| `importBulk` | assets/mission-planner.js:2440 | 7 | 1 | 11 |
| `inBox` | assets/mission-planner.js:2831 | 1 | 1 | 2 |
| `inconsistencias` | assets/modules/ocupacao.js:79 | 57 | 4 | 10 |
| `inferLegacyStructure` | assets/mission-planner.js:566 | 24 | 3 | 4 |
| `iniciar` | assets/mission-planner.js:4064 | 1 | 8 | 2 |
| `initialErr` | assets/mission-planner.js:1441 | 1 | 1 | 2 |
| `initMap` | assets/mission-planner.js:1393 | 68 | 1 | 28 |
| `initSafeBots` | assets/mission-planner.js:1782 | 8 | 1 | 6 |
| `integer` | assets/modules/acoes-gestao-simples.js:18 | 1 | 2 | 1 |
| `invalidateSelected` | assets/mission-planner.js:2506 | 9 | 1 | 5 |
| `invasionExpectation` | assets/modules/roubos-loot-core.js:75 | 1 | 3 | 0 |
| `isCenterValidated` | assets/mission-planner.js:716 | 1 | 5 | 2 |
| `isEditingZone` | assets/mission-planner.js:894 | 1 | 4 | 1 |
| `isGasActive` | assets/mission-planner.js:3897 | 1 | 1 | 1 |
| `isPendingZone` | assets/mission-planner.js:893 | 1 | 4 | 1 |
| `isStale` | assets/mission-planner.js:3216 | 1 | 2 | 2 |
| `isValidated` | assets/mission-planner.js:715 | 1 | 30 | 1 |
| `isWater` | assets/mission-planner.js:2833 | 18 | 4 | 8 |
| `jaExcluida` | assets/mission-planner.js:1010 | 1 | 1 | 1 |
| `joinPairs` | assets/modules/blips-sheet-sync.js:57 | 1 | 1 | 2 |
| `keepForm` | assets/mission-planner.js:2989 | 1 | 2 | 1 |
| `keepFormOuter` | assets/mission-planner.js:3010 | 1 | 1 | 1 |
| `kitFor` | assets/modules/acoes-core.js:63 | 1 | 1 | 1 |
| `kitTable` | assets/modules/acoes-planejador-ui.js:369 | 14 | 1 | 10 |
| `knownHeights` | assets/mission-planner.js:2096 | 16 | 1 | 10 |
| `kpi` | assets/mission-planner.js:3803 | 1 | 17 | 2 |
| `kpis` | assets/modules/roubos-loot-ui.js:21 | 1 | 18 | 3 |
| `landFraction` | assets/mission-planner.js:3024 | 6 | 3 | 4 |
| `layer` | assets/mission-planner.js:1176 | 20 | 7 | 7 |
| `li` | assets/mission-planner.js:3684 | 1 | 5 | 4 |
| `ligarPaineis` | assets/modules/painel-ocupacao.js:50 | 20 | 2 | 6 |
| `list` | assets/mission-planner.js:3658 | 1 | 39 | 3 |
| `listeners` | assets/modules/acoes-planejador-ui.js:667 | 99 | 1 | 25 |
| `ll` | assets/mission-planner.js:542 | 1 | 34 | 2 |
| `load` | assets/modules/acoes-workspace.js:24 | 6 | 6 | 2 |
| `loadPixels` | assets/mission-planner.js:2823 | 8 | 1 | 1 |
| `loadSegmentConfig` | assets/app.js:360 | 1 | 2 | 0 |
| `loadSnapshotPreview` | assets/mission-planner.js:2414 | 2 | 2 | 4 |
| `loadStore` | assets/mission-planner.js:1129 | 20 | 1 | 11 |
| `loadSyncMeta` | assets/mission-planner.js:885 | 4 | 2 | 0 |
| `logRequest` | assets/mission-planner.js:3333 | 1 | 4 | 3 |
| `lookup` | assets/modules/acoes-gestao-simples.js:44 | 8 | 2 | 3 |
| `lootKey` | assets/modules/roubos-loot-core.js:3 | 1 | 5 | 1 |
| `lootPrice` | assets/modules/roubos-loot-core.js:11 | 4 | 4 | 2 |
| `makeCrs` | assets/mission-planner.js:1167 | 6 | 1 | 0 |
| `makeLootPrices` | assets/modules/roubos-loot-core.js:4 | 7 | 3 | 4 |
| `makePriceReference` | assets/modules/acoes-inteligencia.js:14 | 6 | 2 | 3 |
| `managementOptions` | assets/modules/acoes-planejador-ui.js:19 | 4 | 2 | 0 |
| `mapNameOf` | assets/mission-planner.js:547 | 1 | 2 | 0 |
| `mapNotice` | assets/mission-planner.js:1277 | 13 | 6 | 4 |
| `mapsOfEvent` | assets/mission-planner.js:548 | 1 | **ninguém** | 2 |
| `markZoneApplied` | assets/mission-planner.js:3355 | 10 | 2 | 6 |
| `markZoneSent` | assets/mission-planner.js:3343 | 12 | 2 | 8 |
| `match` | assets/modules/acoes-sheet-sync.js:28 | 6 | 3 | 4 |
| `mechanicText` | assets/mission-planner.js:3446 | 1 | 1 | 3 |
| `median` | assets/mission-planner.js:2135 | 1 | 3 | 2 |
| `merchant` | assets/modules/roubos-loot-ui.js:14 | 1 | 2 | 0 |
| `mergeActionRegistry` | assets/modules/acoes-cadastro.js:88 | 14 | 2 | 4 |
| `merged` | assets/modules/acoes-workspace.js:19 | 1 | 4 | 1 |
| `mergeMissions` | assets/mission-planner.js:906 | 45 | 7 | 15 |
| `mergeOfficialPresets` | assets/mission-planner.js:1081 | 22 | 1 | 4 |
| `message` | assets/modules/acoes-workspace.js:20 | 4 | 10 | 1 |
| `metricGroupLabel` | assets/modules/metricas-parser.js:70 | 18 | 2 | 5 |
| `metricSlotLabel` | assets/modules/metricas-parser.js:68 | 1 | 2 | 1 |
| `minTo` | assets/mission-planner.js:2808 | 1 | 1 | 1 |
| `money` | assets/modules/acoes-gestao-simples.js:17 | 1 | 24 | 1 |
| `montarLinhaDoTempo` | assets/modules/metricas-motor.js:68 | 1 | 2 | 0 |
| `mountActionPlanner` | assets/modules/acoes-planejador-ui.js:766 | 4 | **ninguém** | 0 |
| `msDe` | assets/modules/ocupacao.js:54 | 6 | 3 | 1 |
| `mutation` | assets/modules/acoes-workspace.js:155 | 13 | 1 | 5 |
| `n` | assets/modules/acoes-npc-ui.js:9 | 1 | 296 | 0 |
| `navigate` | assets/modules/acoes-workspace.js:70 | 1 | 5 | 0 |
| `nearestPolygonEdgePoint` | assets/mission-planner.js:2142 | 1 | 1 | 3 |
| `nearQg` | assets/mission-planner.js:2853 | 1 | 4 | 2 |
| `newMission` | assets/mission-planner.js:761 | 28 | 2 | 7 |
| `nextPendingId` | assets/mission-planner.js:709 | 6 | 2 | 1 |
| `normEv` | assets/mission-planner.js:2944 | 1 | 1 | 1 |
| `nota` | assets/mission-planner.js:3037 | 1 | 1 | 4 |
| `nowIso` | assets/mission-planner.js:540 | 1 | 28 | 0 |
| `npcStats` | assets/modules/acoes-npc-core.js:6 | 13 | 1 | 3 |
| `ocupado` | assets/modules/ocupacao.js:44 | 1 | 6 | 2 |
| `openDb` | assets/mission-planner.js:1150 | 7 | 2 | 0 |
| `openEditor` | assets/modules/acoes-workspace.js:116 | 20 | 1 | 10 |
| `openEventPackage` | assets/mission-planner.js:3654 | 27 | 2 | 21 |
| `openPadraoModal` | assets/mission-planner.js:3516 | 13 | 2 | 14 |
| `openPartidasModal` | assets/mission-planner.js:2957 | 55 | 2 | 33 |
| `openPartsModal` | assets/mission-planner.js:3233 | 12 | 2 | 7 |
| `openProfile` | assets/modules/acoes-workspace.js:79 | 1 | 1 | 1 |
| `openReplicator` | assets/mission-planner.js:2620 | 21 | 1 | 26 |
| `openSuggestion` | assets/modules/acoes-workspace.js:80 | 1 | 1 | 2 |
| `openTestsModal` | assets/mission-planner.js:3490 | 26 | 1 | 21 |
| `optimizeSpawns` | assets/mission-planner.js:3183 | 30 | 1 | 23 |
| `options` | assets/modules/acoes-planejador-ui.js:26 | 1 | 11 | 1 |
| `orient2d` | assets/mission-planner.js:600 | 1 | 1 | 1 |
| `otherSettings` | assets/modules/acoes-gestao-simples.js:73 | 11 | 1 | 10 |
| `pack` | assets/mission-planner.js:606 | 1 | 1 | 1 |
| `pad2` | assets/mission-planner.js:2772 | 1 | 6 | 1 |
| `padraoText` | assets/mission-planner.js:3468 | 10 | 2 | 3 |
| `painelDisponiveisHtml` | assets/modules/painel-ocupacao.js:31 | 18 | 2 | 11 |
| `painelOcupacaoHtml` | assets/modules/painel-ocupacao.js:17 | 13 | 2 | 10 |
| `paint` | assets/modules/acoes-workspace.js:30 | 40 | 1 | 9 |
| `pair` | assets/modules/blips-sheet-sync.js:52 | 5 | 6 | 3 |
| `panelLabel` | assets/mission-planner.js:3454 | 1 | 5 | 1 |
| `partidasDe` | assets/mission-planner.js:2908 | 1 | 9 | 0 |
| `partidasEvento` | assets/mission-planner.js:2909 | 1 | 4 | 2 |
| `payoutPair` | assets/modules/acoes-planejador-ui.js:40 | 6 | 2 | 3 |
| `pct` | assets/modules/roubos-loot-ui.js:10 | 1 | 8 | 1 |
| `pendFilter` | assets/mission-planner.js:3799 | 1 | 1 | 1 |
| `percent` | assets/modules/acoes-planejador-ui.js:10 | 1 | 6 | 1 |
| `persistBootStateLocalOnly` | assets/mission-planner.js:1104 | 7 | **ninguém** | 2 |
| `persisted` | assets/modules/acoes-npc-ui.js:13 | 1 | 4 | 1 |
| `phaseStart` | assets/mission-planner.js:1812 | 1 | 1 | 1 |
| `photosAndRules` | assets/modules/acoes-planejador-ui.js:338 | 23 | 1 | 8 |
| `photoUrl` | assets/modules/acoes-core.js:143 | 4 | 3 | 2 |
| `pinIcon` | assets/mission-planner.js:1462 | 6 | 1 | 2 |
| `place` | assets/modules/acoes-planejador-ui.js:25 | 1 | 5 | 1 |
| `placeSafeOnMap` | assets/mission-planner.js:1635 | 10 | 1 | 9 |
| `plain` | assets/modules/blips-sheet-sync.js:12 | 1 | 12 | 0 |
| `planApprovedActionSheetUpdate` | assets/modules/acoes-sheet-sync.js:15 | 1 | 1 | 0 |
| `planNewSection` | assets/modules/blips-sheet-sync.js:160 | 36 | 1 | 10 |
| `pointDistanceFromCenter` | assets/mission-planner.js:651 | 1 | 7 | 0 |
| `pointInPolygon` | assets/mission-planner.js:2139 | 1 | 2 | 3 |
| `pointInsideZone` | assets/mission-planner.js:652 | 1 | 2 | 3 |
| `pointOnSegment` | assets/mission-planner.js:2138 | 1 | 1 | 2 |
| `pointSegmentDistance` | assets/mission-planner.js:2136 | 1 | 1 | 0 |
| `pointWater` | assets/mission-planner.js:2858 | 6 | 2 | 4 |
| `polygonArea` | assets/mission-planner.js:594 | 1 | 3 | 0 |
| `polygonCentroid` | assets/mission-planner.js:596 | 1 | 1 | 3 |
| `polygonEdgeAccess` | assets/mission-planner.js:2137 | 1 | 2 | 2 |
| `polygonPerimeter` | assets/mission-planner.js:595 | 1 | 2 | 1 |
| `polygonSelfIntersections` | assets/mission-planner.js:602 | 1 | 1 | 2 |
| `prepareIncoming` | assets/mission-planner.js:897 | 5 | 2 | 2 |
| `prepareInvasion` | assets/modules/roubos-loot-core.js:64 | 11 | 1 | 5 |
| `presetMission` | assets/mission-planner.js:727 | 34 | 2 | 6 |
| `previewSafePlacement` | assets/mission-planner.js:1621 | 8 | 1 | 3 |
| `priceOf` | assets/modules/acoes-core.js:44 | 14 | 4 | 7 |
| `prices` | assets/modules/roubos-loot-ui.js:17 | 1 | 14 | 6 |
| `profit` | assets/modules/acoes-gestao-simples.js:120 | 1 | 2 | 1 |
| `progress` | assets/modules/acoes-gestao-simples.js:156 | 3 | 3 | 0 |
| `published` | assets/modules/acoes-workspace.js:16 | 1 | 4 | 0 |
| `push` | assets/modules/metricas-motor.js:70 | 6 | 1 | 2 |
| `pushBackup` | assets/mission-planner.js:854 | 19 | 2 | 0 |
| `pushUndo` | assets/mission-planner.js:2349 | 3 | 3 | 2 |
| `put` | assets/modules/blips-sheet-sync.js:108 | 4 | 3 | 3 |
| `q` | assets/mission-planner.js:3050 | 1 | 41 | 1 |
| `qgList` | assets/mission-planner.js:2851 | 1 | 6 | 0 |
| `qs` | assets/mission-planner.js:3 | 1 | 102 | 0 |
| `qsa` | assets/mission-planner.js:4 | 1 | 25 | 0 |
| `qtyFor` | assets/modules/acoes-core.js:58 | 5 | 1 | 2 |
| `quantile` | assets/modules/roubos-loot-core.js:121 | 1 | 1 | 0 |
| `queueSnapshot` | assets/mission-planner.js:2395 | 1 | 3 | 1 |
| `r2` | assets/mission-planner.js:2707 | 1 | 7 | 1 |
| `raioQg` | assets/mission-planner.js:2852 | 1 | 4 | 1 |
| `random` | assets/modules/roubos-loot-core.js:104 | 1 | 1 | 0 |
| `rankBoard` | assets/modules/acoes-planejador-ui.js:213 | 49 | 2 | 15 |
| `rankFormat` | assets/modules/acoes-planejador-ui.js:207 | 3 | 1 | 2 |
| `rankingMetrics` | assets/modules/acoes-ranking.js:21 | 1 | 1 | 0 |
| `rawCds` | assets/mission-planner.js:2092 | 1 | 7 | 2 |
| `read` | assets/modules/acoes-workspace.js:101 | 1 | 3 | 1 |
| `readBackups` | assets/mission-planner.js:873 | 3 | 2 | 0 |
| `readLocalPresets` | assets/mission-planner.js:2285 | 1 | 2 | 0 |
| `readPolygonBulk` | assets/mission-planner.js:2011 | 1 | 1 | 6 |
| `recommendedMaximum` | assets/modules/acoes-inteligencia.js:8 | 5 | 2 | 1 |
| `recordSafeDemonstration` | assets/mission-planner.js:1832 | 12 | 1 | 9 |
| `recoverEditDraft` | assets/mission-planner.js:2276 | 9 | 1 | 5 |
| `recoverMissingFromLocalBackups` | assets/mission-planner.js:1111 | 18 | 1 | 8 |
| `redoEdit` | assets/mission-planner.js:2356 | 1 | 1 | 2 |
| `referenceCatalog` | assets/modules/acoes-inteligencia.js:20 | 3 | 1 | 0 |
| `refreshEvents` | assets/mission-planner.js:2631 | 1 | 1 | 3 |
| `refreshPriceAlerts` | assets/modules/acoes-planejador-ui.js:110 | 30 | 3 | 12 |
| `refreshPriceCatalog` | assets/modules/acoes-planejador-ui.js:152 | 19 | 3 | 5 |
| `refreshSheetPrizes` | assets/modules/acoes-planejador-ui.js:171 | 13 | 1 | 3 |
| `rejectProposal` | assets/modules/acoes-planejador-ui.js:611 | 17 | 1 | 7 |
| `reload` | assets/modules/acoes-workspace.js:168 | 3 | 2 | 1 |
| `reloadMapTiles` | assets/mission-planner.js:1302 | 6 | 1 | 2 |
| `removeDynamicSafeStage` | assets/mission-planner.js:1661 | 1 | 1 | 3 |
| `removeSafeStage` | assets/mission-planner.js:1654 | 7 | 2 | 6 |
| `render` | assets/modules/roubos-loot-ui.js:22 | 14 | 40 | 15 |
| `renderApprovalPayoutRange` | assets/modules/acoes-planejador-ui.js:46 | 15 | 1 | 6 |
| `renderBackupList` | assets/mission-planner.js:3940 | 18 | 2 | 9 |
| `renderCenterValidation` | assets/mission-planner.js:1951 | 2 | 2 | 10 |
| `renderCentralV954` | assets/mission-planner.js:3791 | 47 | 7 | 56 |
| `renderCoverage` | assets/mission-planner.js:2028 | 32 | 5 | 23 |
| `renderDominationPolygonUi` | assets/mission-planner.js:2023 | 4 | 3 | 17 |
| `renderExplosiveComparison` | assets/modules/acoes-planejador-ui.js:399 | 24 | 1 | 10 |
| `renderLocalPresets` | assets/mission-planner.js:2289 | 5 | 2 | 13 |
| `renderManagement` | assets/modules/acoes-planejador-ui.js:70 | 39 | 3 | 12 |
| `renderMap` | assets/mission-planner.js:1869 | 36 | 15 | 35 |
| `renderMapLegend` | assets/mission-planner.js:1861 | 8 | 1 | 9 |
| `renderMissionList` | assets/mission-planner.js:1906 | 3 | 1 | 1 |
| `renderPlannerBadges` | assets/mission-planner.js:4028 | 14 | 1 | 9 |
| `renderPointList` | assets/mission-planner.js:1921 | 11 | 1 | 17 |
| `renderProTools` | assets/mission-planner.js:2294 | 25 | 1 | 31 |
| `renderSafeRouteUi` | assets/mission-planner.js:1662 | 14 | 6 | 27 |
| `renderWorkspaceBar` | assets/mission-planner.js:3865 | 3 | 2 | 2 |
| `renumberSpawns` | assets/mission-planner.js:1915 | 3 | 1 | 3 |
| `repaintRegistry` | assets/modules/acoes-planejador-ui.js:34 | 6 | 1 | 4 |
| `repairFacxFacHierarchy` | assets/mission-planner.js:816 | 30 | 1 | 2 |
| `repairKnownZoneAssignments` | assets/mission-planner.js:791 | 24 | 1 | 4 |
| `replaceMapBases` | assets/mission-planner.js:1294 | 8 | 3 | 5 |
| `requireEdit` | assets/mission-planner.js:2363 | 1 | 21 | 0 |
| `requireSafePreflight` | assets/mission-planner.js:2212 | 11 | 2 | 5 |
| `resetMapPlacementModes` | assets/mission-planner.js:2362 | 1 | 7 | 2 |
| `resolveSyncConflict` | assets/mission-planner.js:3777 | 13 | 1 | 6 |
| `resolveZoneConflicts` | assets/mission-planner.js:978 | 21 | 3 | 10 |
| `restaurarArquivo` | assets/mission-planner.js:3967 | 14 | 1 | 5 |
| `restoreEditSnapshot` | assets/mission-planner.js:2352 | 3 | 2 | 5 |
| `resultCards` | assets/modules/acoes-gestao-simples.js:130 | 19 | 2 | 6 |
| `retornoHoras` | assets/mission-planner.js:3215 | 1 | 3 | 1 |
| `revDe` | assets/mission-planner.js:1008 | 1 | 1 | 0 |
| `robberyProjection` | assets/modules/roubos-loot-core.js:29 | 1 | **ninguém** | 0 |
| `rotate` | assets/mission-planner.js:1994 | 1 | 2 | 3 |
| `rotuloColeta` | assets/modules/metricas-motor.js:238 | 5 | 3 | 2 |
| `round` | assets/modules/acoes-gestao.js:9 | 1 | 1 | 0 |
| `rows` | assets/modules/acoes-workspace.js:100 | 1 | 84 | 0 |
| `rowsHtml` | assets/modules/acoes-npc-ui.js:32 | 12 | 1 | 7 |
| `run` | assets/mission-planner.js:2572 | 3 | 4 | 2 |
| `safe` | assets/modules/acoes-npc-ui.js:7 | 1 | 45 | 2 |
| `safeBearingLabel` | assets/mission-planner.js:1696 | 1 | 1 | 0 |
| `safeBlank` | assets/modules/blips-sheet-sync.js:127 | 10 | 1 | 5 |
| `safeDuration` | assets/mission-planner.js:3023 | 1 | 1 | 2 |
| `safeFinalCloseSeconds` | assets/mission-planner.js:1525 | 1 | 2 | 0 |
| `safeGasMask` | assets/mission-planner.js:1751 | 6 | 2 | 1 |
| `safeInitialStage` | assets/mission-planner.js:1517 | 4 | 4 | 3 |
| `safeIssueStage` | assets/mission-planner.js:2195 | 5 | **ninguém** | 0 |
| `safeName` | assets/mission-planner.js:2416 | 1 | 1 | 2 |
| `safeParts` | assets/mission-planner.js:2689 | 9 | 2 | 5 |
| `safePlacementCheck` | assets/mission-planner.js:1613 | 4 | **ninguém** | 2 |
| `safePreflight` | assets/mission-planner.js:2200 | 7 | 1 | 3 |
| `safePreviewAt` | assets/mission-planner.js:1798 | 10 | 4 | 12 |
| `safeRouteAudit` | assets/mission-planner.js:1536 | 28 | 2 | 6 |
| `safeRulesSig` | assets/mission-planner.js:3479 | 4 | 1 | 1 |
| `safeStageMinRadius` | assets/mission-planner.js:1645 | 1 | **ninguém** | 0 |
| `safeStageValid` | assets/mission-planner.js:1516 | 1 | 16 | 1 |
| `safeTestPlayerStatus` | assets/mission-planner.js:1765 | 4 | 1 | 1 |
| `safeTimeline` | assets/mission-planner.js:1526 | 6 | 3 | 6 |
| `safeTotalSeconds` | assets/mission-planner.js:1532 | 1 | 9 | 1 |
| `safeTransitionGeometry` | assets/mission-planner.js:1692 | 4 | 2 | 1 |
| `safeTransitionSeconds` | assets/mission-planner.js:1521 | 4 | 3 | 0 |
| `safeWalkAnalysis` | assets/mission-planner.js:1697 | 7 | 5 | 8 |
| `sampleOceanFromTile` | assets/mission-planner.js:1213 | 40 | 1 | 4 |
| `sanitizeDashboardConfig` | assets/app.js:102 | 1 | 2 | 0 |
| `save` | assets/modules/acoes-workspace.js:140 | 15 | 8 | 8 |
| `saveDashboardConfig` | assets/app.js:159 | 35 | 1 | 7 |
| `saveEditDraft` | assets/mission-planner.js:2271 | 4 | 1 | 4 |
| `saveFactionToDiscord` | assets/app.js:71 | 1 | **ninguém** | 0 |
| `saveLocalPreset` | assets/mission-planner.js:2286 | 3 | 1 | 6 |
| `saveMission` | assets/mission-planner.js:2366 | 1 | 2 | 18 |
| `saveReference` | assets/modules/acoes-planejador-ui.js:140 | 12 | 1 | 6 |
| `saveSnapshot` | assets/mission-planner.js:1157 | 6 | 1 | 4 |
| `saveStore` | assets/mission-planner.js:1026 | 10 | 21 | 2 |
| `saveSyncMeta` | assets/mission-planner.js:889 | 3 | 5 | 0 |
| `scenarios` | assets/modules/acoes-planejador-ui.js:383 | 16 | 1 | 12 |
| `sectionsIn` | assets/modules/blips-sheet-sync.js:112 | 15 | 1 | 8 |
| `sector` | assets/modules/blips-sheet-sync.js:16 | 34 | 3 | 6 |
| `segmentCross` | assets/mission-planner.js:601 | 1 | 1 | 3 |
| `segmentDefs` | assets/app.js:343 | 1 | 7 | 0 |
| `segmentNames` | assets/app.js:344 | 1 | 8 | 2 |
| `selectEventForAction` | assets/mission-planner.js:3771 | 5 | 1 | 1 |
| `selectMarket` | assets/modules/acoes-npc-ui.js:137 | 3 | 1 | 4 |
| `selectPoint` | assets/mission-planner.js:1934 | 8 | 4 | 8 |
| `selectSafeStage` | assets/mission-planner.js:1676 | 1 | 2 | 0 |
| `sessionMeta` | assets/app.js:1198 | 2 | **ninguém** | 0 |
| `setCloudState` | assets/mission-planner.js:1041 | 6 | 5 | 3 |
| `setDashboardAlertState` | assets/app.js:243 | 27 | 1 | 9 |
| `setEventTarget` | assets/mission-planner.js:2784 | 10 | 1 | 9 |
| `setPlannerTab` | assets/mission-planner.js:3929 | 8 | 5 | 3 |
| `setSafeConfigView` | assets/mission-planner.js:1534 | 1 | 1 | 4 |
| `setSaveState` | assets/mission-planner.js:2394 | 1 | 30 | 1 |
| `setStatus` | assets/mission-planner.js:1196 | 1 | 3 | 2 |
| `setValidationFeedback` | assets/mission-planner.js:2447 | 4 | 5 | 2 |
| `setWorkspace` | assets/mission-planner.js:3844 | 7 | 5 | 3 |
| `setZoneProposal` | assets/mission-planner.js:2001 | 1 | 1 | 6 |
| `sheets` | assets/modules/blips-sheet-sync.js:100 | 8 | 6 | 0 |
| `simulateInvasions` | assets/modules/roubos-loot-core.js:100 | 1 | 2 | 0 |
| `situacaoGroup` | assets/modules/ocupacao.js:30 | 1 | 9 | 0 |
| `slotMin` | assets/modules/metricas-motor.js:55 | 5 | 2 | 1 |
| `slotNormal` | assets/modules/metricas-motor.js:60 | 4 | 1 | 2 |
| `sources` | assets/modules/roubos-loot-ui.js:15 | 1 | 2 | 0 |
| `spawnIndexOf` | assets/mission-planner.js:2910 | 5 | 1 | 0 |
| `spawnInsideDomination` | assets/mission-planner.js:2140 | 1 | 3 | 5 |
| `spawnProblems` | assets/mission-planner.js:1910 | 5 | 4 | 1 |
| `spawnShortfall` | assets/mission-planner.js:2783 | 1 | 2 | 1 |
| `splitDiscord` | assets/mission-planner.js:3221 | 12 | 3 | 2 |
| `spreadOf` | assets/mission-planner.js:3129 | 1 | 1 | 0 |
| `stageInfo` | assets/mission-planner.js:3331 | 1 | 2 | 1 |
| `startEdit` | assets/mission-planner.js:2364 | 2 | 12 | 8 |
| `startMapWatchdog` | assets/mission-planner.js:1308 | 25 | 1 | 5 |
| `startSafePresentation` | assets/mission-planner.js:1734 | 13 | 1 | 12 |
| `startSafePreview` | assets/mission-planner.js:1817 | 14 | 3 | 16 |
| `stopSafePreview` | assets/mission-planner.js:1715 | 10 | 4 | 2 |
| `str` | assets/modules/acoes-sheet-sync.js:14 | 1 | 1 | 0 |
| `suggestedMapCoord` | assets/mission-planner.js:1589 | 4 | 1 | 5 |
| `suggestLocations` | assets/mission-planner.js:3076 | 24 | 1 | 18 |
| `suggestSpawns` | assets/mission-planner.js:2798 | 19 | 2 | 9 |
| `summarize` | assets/modules/roubos-loot-ui.js:41 | 34 | 2 | 24 |
| `summary` | assets/modules/acoes-planejador-ui.js:423 | 98 | 14 | 17 |
| `switchMission` | assets/mission-planner.js:2585 | 1 | 1 | 8 |
| `technicalSummary` | assets/mission-planner.js:2246 | 4 | 1 | 7 |
| `temFaccao` | assets/modules/ocupacao.js:23 | 1 | 3 | 0 |
| `tempoDesde` | assets/modules/eventos-painel.js:138 | 9 | 1 | 3 |
| `temQG` | assets/modules/ocupacao.js:25 | 1 | 2 | 0 |
| `terrainIssues` | assets/mission-planner.js:2864 | 5 | 1 | 6 |
| `testList` | assets/mission-planner.js:3483 | 1 | 2 | 1 |
| `testStatus` | assets/mission-planner.js:3484 | 5 | 3 | 2 |
| `tick` | assets/mission-planner.js:1311 | 20 | 1 | 4 |
| `tipoDe` | assets/modules/eventos-painel.js:121 | 7 | 1 | 0 |
| `tpCds` | assets/mission-planner.js:2125 | 5 | 4 | 4 |
| `trocarBase` | assets/mission-planner.js:1369 | 6 | 1 | 6 |
| `uid` | assets/mission-planner.js:541 | 1 | 8 | 0 |
| `undoEdit` | assets/mission-planner.js:2355 | 1 | 1 | 2 |
| `updateEditUi` | assets/mission-planner.js:2369 | 25 | 7 | 4 |
| `updateExport` | assets/mission-planner.js:2320 | 2 | 1 | 6 |
| `updateMapDiagnostics` | assets/mission-planner.js:1272 | 5 | 5 | 3 |
| `updatePrizeInputs` | assets/modules/acoes-workspace.js:108 | 8 | 2 | 2 |
| `updateSafeBots` | assets/mission-planner.js:1790 | 8 | 1 | 5 |
| `updateSafeGasMask` | assets/mission-planner.js:1757 | 7 | 1 | 2 |
| `updateSafeTestPlayerMarker` | assets/mission-planner.js:1769 | 8 | 2 | 5 |
| `updateSlider` | assets/modules/acoes-gestao-simples.js:186 | 8 | 1 | 4 |
| `updateStepUi` | assets/mission-planner.js:3900 | 8 | 2 | 7 |
| `upsertDashboardAlertLocal` | assets/app.js:233 | 1 | 2 | 0 |
| `useLocation` | assets/mission-planner.js:3110 | 14 | 1 | 12 |
| `vagoDesdeMs` | assets/modules/ocupacao.js:62 | 1 | 1 | 0 |
| `validate` | assets/mission-planner.js:2632 | 2 | 4 | 8 |
| `validateBulk` | assets/mission-planner.js:2482 | 24 | 1 | 12 |
| `validateCenter` | assets/mission-planner.js:1953 | 11 | 1 | 11 |
| `validateSelected` | assets/mission-planner.js:2451 | 1 | 2 | 0 |
| `validCoord` | assets/mission-planner.js:655 | 1 | 57 | 0 |
| `validMetricDate` | assets/modules/metricas-parser.js:29 | 5 | 1 | 0 |
| `valorColeta` | assets/modules/metricas-motor.js:64 | 2 | 1 | 0 |
| `valuesFor` | assets/modules/blips-sheet-sync.js:58 | 42 | 1 | 8 |
| `visibleSteps` | assets/mission-planner.js:3898 | 1 | 2 | 1 |
| `wasApplied` | assets/mission-planner.js:3332 | 1 | 10 | 0 |
| `watchOcean` | assets/mission-planner.js:1253 | 13 | 4 | 3 |
| `weightedLoot` | assets/modules/roubos-loot-core.js:15 | 1 | 2 | 0 |
| `wKey` | assets/mission-planner.js:2857 | 1 | 1 | 1 |
| `writable` | assets/modules/acoes-workspace.js:18 | 1 | 5 | 0 |
| `zHint` | assets/mission-planner.js:2130 | 4 | 2 | 3 |
| `zoneBalance` | assets/mission-planner.js:2757 | 15 | 2 | 4 |
| `zoneCapacity` | assets/mission-planner.js:2745 | 1 | 4 | 1 |
| `zoneChecks` | assets/mission-planner.js:3247 | 74 | 2 | 31 |
| `zoneCoverageCounts` | assets/mission-planner.js:653 | 1 | 5 | 6 |
| `zoneGeoText` | assets/mission-planner.js:3391 | 46 | 2 | 17 |
| `zoneHash` | assets/mission-planner.js:892 | 1 | 5 | 1 |
| `zoneInsights` | assets/mission-planner.js:2915 | 13 | 5 | 6 |
| `zoneOperation` | assets/mission-planner.js:2182 | 1 | 1 | 0 |
| `zoneOverlaps` | assets/mission-planner.js:3381 | 8 | 1 | 4 |
| `zoneProposalPoints` | assets/mission-planner.js:1992 | 8 | 2 | 7 |
| `zoneReady` | assets/mission-planner.js:3321 | 1 | 3 | 2 |
| `zonesInPanel` | assets/mission-planner.js:3378 | 3 | 2 | 2 |
| `zonesOfEvent` | assets/mission-planner.js:546 | 1 | 30 | 0 |
| `zonesOfMap` | assets/mission-planner.js:549 | 1 | **ninguém** | 2 |
| `zoneStage` | assets/mission-planner.js:3322 | 9 | 7 | 3 |

## SESSÕES E AUDITORIA DE USUÁRIOS

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `auditModule` | assets/app.js:4402 | 14 | 1 | 0 |
| `auditTarget` | assets/app.js:4416 | 1 | 1 | 0 |
| `isSameLocalDay` | assets/app.js:4423 | 1 | 1 | 1 |
| `sessionActions` | assets/app.js:4420 | 1 | 3 | 1 |
| `sessionDuration` | assets/app.js:4422 | 1 | 2 | 2 |
| `sessionEffectiveEnd` | assets/app.js:4421 | 1 | 3 | 4 |
| `sessionEndMs` | assets/app.js:4418 | 1 | 2 | 1 |
| `sessionStartMs` | assets/app.js:4417 | 1 | 5 | 1 |

## Solicitações

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `renderRequestStatus` | assets/mission-planner.js:3693 | 49 | 2 | 40 |
| `requestChangeScope` | assets/mission-planner.js:2184 | 11 | 1 | 4 |
| `requestComparable` | assets/mission-planner.js:2183 | 1 | 2 | 1 |

## TRANSFERÊNCIA DE PAINEL, TROCA DE QG E ADMINISTRAÇÃO

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `adminWipe` | assets/app.js:11384 | 33 | 1 | 6 |
| `cleanSnapshot` | assets/app.js:11155 | 4 | 1 | 1 |
| `isAdmin` | assets/app.js:11150 | 4 | 16 | 0 |
| `movementOpen` | assets/app.js:11160 | 39 | 1 | 9 |
| `movementPreview` | assets/app.js:11200 | 12 | 2 | 4 |
| `wipeCollection` | assets/app.js:11377 | 6 | 2 | 6 |

## UI KIT (script classico, carregado antes do app.js)

| Função | Arquivo:linha | Linhas | Chamada por | Chama |
|---|---|---|---|---|
| `boot` | assets/ui-kit.js:221 | 1 | 3 | 5 |
| `classify` | assets/ui-kit.js:30 | 7 | 1 | 2 |
| `dismiss` | assets/ui-kit.js:72 | 5 | 1 | 1 |
| `ensureRegion` | assets/ui-kit.js:13 | 9 | 1 | 0 |
| `labelIconButtons` | assets/ui-kit.js:140 | 25 | 1 | 2 |
| `observarMudancas` | assets/ui-kit.js:209 | 11 | 1 | 1 |
| `rotularDinamicos` | assets/ui-kit.js:194 | 14 | 2 | 0 |
| `setOpen` | assets/ui-kit.js:121 | 5 | 1 | 0 |
| `setupNav` | assets/ui-kit.js:95 | 43 | 1 | 2 |
| `skipLink` | assets/ui-kit.js:167 | 10 | 1 | 0 |
| `toast` | assets/ui-kit.js:42 | 43 | 1 | 6 |
