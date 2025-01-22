<template>
    <v-main>
        <TitleBar title="視聴"></TitleBar>
        <transition name="page">
            <div class="video-container-wrap mx-auto">
                <VideoContainer v-if="videoParam !== null" ref="video" v-on:onCapture="onCapture" v-bind:videoParam="videoParam"></VideoContainer>
                <WatchOnRecordedInfoCard v-if="recordedId !== null" ref="card" v-bind:recordedId="recordedId"></WatchOnRecordedInfoCard>
                <div style="visibility: hidden">dummy</div>
            </div>
        </transition>
    </v-main>
</template>

<script lang="ts">
import WatchOnRecordedInfoCard from '@/components/recorded/watch/WatchRecordedInfoCard.vue';
import TitleBar from '@/components/titleBar/TitleBar.vue';
import VideoContainer from '@/components/video/VideoContainer.vue';
import { BaseVideoParam, NormalVideoParam } from '@/components/video/VideoParam';
import container from '@/model/ModelContainer';
import IScrollPositionState from '@/model/state/IScrollPositionState';
import ISnackbarState, { SnackBarTextOption } from '@/model/state/snackbar/ISnackbarState';
import IServerConfigModel from '@/model/serverConfig/IServerConfigModel';
import { Component, Vue, Watch } from 'vue-property-decorator';
import CaptureUtil from '@/util/CaptureUtil';
import * as apid from '../../../api';

Component.registerHooks(['beforeRouteUpdate', 'beforeRouteLeave']);

@Component({
    components: {
        TitleBar,
        VideoContainer,
        WatchOnRecordedInfoCard,
    },
})
export default class WatchRecorded extends Vue {
    public videoParam: BaseVideoParam | null = null;
    public recordedId: apid.RecordedId | null = null;

    private scrollState: IScrollPositionState = container.get<IScrollPositionState>('IScrollPositionState');
    private snackbarState: ISnackbarState = container.get<ISnackbarState>('ISnackbarState');
    private serverConfig: IServerConfigModel = container.get<IServerConfigModel>('IServerConfigModel');

    private imageUploader: apid.ImageUploaderInfo | null = null;

    constructor() {
        super();
        const config = this.serverConfig.getConfig();
        if (config === null) {
            console.log('config is null');
            return;
        }
        if (config?.imageUploader) {
            this.imageUploader = config.imageUploader;
        }
    }
    @Watch('$route', { immediate: true, deep: true })
    public onUrlChange(): void {
        // 視聴パラメータセット
        const videoId = typeof this.$route.query.videoId !== 'string' ? null : parseInt(this.$route.query.videoId, 10);
        this.recordedId = typeof this.$route.query.recordedId !== 'string' ? null : parseInt(this.$route.query.recordedId, 10);

        this.$nextTick(async () => {
            if (videoId !== null) {
                (this.videoParam as NormalVideoParam) = {
                    type: 'Normal',
                    src: `./api/videos/${videoId}`,
                };
            }

            // データ取得完了を通知
            await this.scrollState.emitDoneGetData();
        });
    }

    /**
     * キャプチャダウンロード
     */
    public async onCapture(data: CaptureUtil.CaptureInfo): Promise<void> {
        if (data.dataUrl === '') {
            this.snackbarState.open({
                color: 'error',
                text: 'キャプチャに失敗しました。',
            });
            return;
        }
        if (typeof this.$refs.card !== 'undefined') {
            data.title = `${(this.$refs.card as WatchOnRecordedInfoCard).displayInfo?.name}`;
        }
        const result = (await CaptureUtil.onCapture(data, this.imageUploader)) as SnackBarTextOption;
        this.snackbarState.open(result);
    }
}
</script>

<style lang="sass" scoped>
.video-container-wrap
    max-width: 1200px
</style>
