import { TableName } from '../DBSchema';
import MigrationBase from '../MigrationBase';

/**
 * MigrationV4
 */
abstract class MigrationV4 extends MigrationBase {
    public readonly revision: number = 4;

    public async upgrade(): Promise<void> {
        await this.operator.runTransaction(async(exec: (query: string, values?: any) => Promise<void>) => {
            // Programs へ sub1Genre1 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Programs,
                'sub1Genre1',
                this.getProgramGenreColumnDefine(),
            ));
            // Programs へ sub1Genre2 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Programs,
                'sub1Genre2',
                this.getProgramGenreColumnDefine(),
            ));
            // Programs へ sub2Genre1 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Programs,
                'sub2Genre1',
                this.getProgramGenreColumnDefine(),
            ));
            // Programs へ sub2Genre2 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Programs,
                'sub2Genre2',
                this.getProgramGenreColumnDefine(),
            ));
            // Recorded へ sub1Genre1 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Recorded,
                'sub1Genre1',
                this.getProgramGenreColumnDefine(),
            ));
            // Reorded へ sub1Genre2 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Recorded,
                'sub1Genre2',
                this.getProgramGenreColumnDefine(),
            ));
            // Recorded へ sub2Genre1 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Recorded,
                'sub2Genre1',
                this.getProgramGenreColumnDefine(),
            ));
            // Recorded へ sub2Genre2 カラムを追加
            await exec(this.operator.createAddcolumnQueryStr(
                TableName.Recorded,
                'sub2Genre2',
                this.getProgramGenreColumnDefine(),
            ));


        });
    }

    /**
     * Program へ Genre カラム追加時のカラム情報
     * @return string
     */
    protected getProgramGenreColumnDefine(): string {
        return 'integer null default null';
    }
}

export default MigrationV4;

