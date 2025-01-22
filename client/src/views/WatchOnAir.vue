<template>
    <v-main>
        <TitleBar title="視聴"></TitleBar>
        <transition name="page">
            <div class="video-container-wrap mx-auto">
                <VideoContainer v-if="videoParam !== null" v-bind:videoParam="videoParam" ref="video" v-on:onCapture="onCapture"></VideoContainer>
                <WatchOnAirInfoCard v-if="watchParam !== null" v-bind:channel="watchParam.channel" ref="card" v-bind:mode="watchParam.mode"></WatchOnAirInfoCard>
                <div style="visibility: hidden">dummy</div>
            </div>
        </transition>
    </v-main>
</template>

<script lang="ts">
import WatchOnAirInfoCard from '@/components/onair/watch/WatchOnAirInfoCard.vue';
import TitleBar from '@/components/titleBar/TitleBar.vue';
import VideoContainer from '@/components/video/VideoContainer.vue';
import { BaseVideoParam, LiveHLSParam, LiveMpegTsVideoParam, NormalVideoParam } from '@/components/video/VideoParam';
import container from '@/model/ModelContainer';
import IScrollPositionState from '@/model/state/IScrollPositionState';
import ISnackbarState, { SnackBarTextOption } from '@/model/state/snackbar/ISnackbarState';
import IServerConfigModel from '@/model/serverConfig/IServerConfigModel';
import Util from '@/util/Util';
import UaUtil from '@/util/UaUtil';
import CaptureUtil from '@/util/CaptureUtil';
import { Component, Vue, Watch } from 'vue-property-decorator';
import * as apid from '../../../api';
import SnackbarState from '@/model/state/snackbar/SnackbarState';

Component.registerHooks(['beforeRouteUpdate', 'beforeRouteLeave']);

interface WatchParam {
    type: string;
    channel: apid.ChannelId;
    mode: number;
}

@Component({
    components: {
        TitleBar,
        VideoContainer,
        WatchOnAirInfoCard,
    },
})
export default class WatchOnAir extends Vue {
    public videoParam: BaseVideoParam | null = null;

    private scrollState: IScrollPositionState = container.get<IScrollPositionState>('IScrollPositionState');
    private snackbarState: ISnackbarState = container.get<ISnackbarState>('ISnackbarState');
    private serverConfig: IServerConfigModel = container.get<IServerConfigModel>('IServerConfigModel');

    private watchParam: WatchParam | null = null;
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
        this.watchParam =
            typeof this.$route.query.type !== 'string' || typeof this.$route.query.channel !== 'string' || typeof this.$route.query.mode !== 'string'
                ? null
                : {
                      type: this.$route.query.type,
                      channel: parseInt(this.$route.query.channel, 10),
                      mode: parseInt(this.$route.query.mode, 10),
                  };

        this.$nextTick(async () => {
            if (this.watchParam !== null) {
                if (this.watchParam.type === 'hls') {
                    (this.videoParam as LiveHLSParam) = {
                        type: 'LiveHLS',
                        channelId: this.watchParam.channel,
                        mode: this.watchParam.mode,
                    };
                } else if (this.watchParam.type === 'm2tsll') {
                    (this.videoParam as LiveMpegTsVideoParam) = {
                        type: 'LiveMpegTs',
                        src: `${window.location.origin}${Util.getSubDirectory()}/api/streams/live/${this.watchParam.channel}/m2tsll?mode=${this.watchParam.mode}`,
                    };
                } else {
                    (this.videoParam as NormalVideoParam) = {
                        type: 'Normal',
                        src: `./api/streams/live/${this.watchParam.channel}/${this.watchParam.type}?mode=${this.watchParam.mode}`,
                    };
                }
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
            data.title = `${(this.$refs.card as WatchOnAirInfoCard).displayInfo?.name}`;
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
