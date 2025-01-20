import styles from './styles.module.css';
import Link from 'next/link';
import BmcaWidget from '../components/bmac/coffee';
import PalletComponent from '../components/engine';
import GridView from '../components/onpage/grid/gridView';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/next-auth-option';
import { redirect } from 'next/navigation';

export default async function Page() {

  // const session = await getServerSession(authOptions);

  // if ( session ) {
  //   redirect( '/dashboard' );
  // }

  return (
    <div className={styles.container}>
      <div className={styles.subcontainer}>
        <PalletComponent url="" mode="viewer"></PalletComponent>
      </div>      
      <BmcaWidget></BmcaWidget>
      <div className={styles.gridcontainer}>
        <div className={styles.gridouter}>
          <GridView></GridView>
        </div>
      </div>
    </div>    
  );
}