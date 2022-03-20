import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('add-voting', 'Add new voting')
  .addParam(
    'title',
    'The voting title',
    '',
    types.string
  )
  .setAction(async ({ title }) => {
    console.log("add-voting ", title);
  });
