import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('add-vote', 'Add vote to voting')
  .addParam(
    'voting',
    'The voting identifier',
    '',
    types.string
  )
  .addParam(
    'variant',
    'The voting variant - true or false',
    false,
    types.boolean
  )
  .setAction(async ({ voting, variant }) => {
    console.log('add-vote ', voting, variant);
  });
