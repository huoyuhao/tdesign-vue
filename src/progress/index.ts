import _Progress from './progress';
import withInstall from '../utils/withInstall';
import { TdProgressProps } from './type';

export type ProgressProps = TdProgressProps;
export * from './type';

export const Progress = withInstall('Progress', _Progress);
export default Progress;
