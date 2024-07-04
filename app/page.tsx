//import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './entry.module.css';

export default function Page() {
  //const router = useRouter();
  const redirects = { about: "", demo: "", editor: "SubApp", document: "", letter: "" };
  return (
    <div className={styles.container}>
      <div className={styles.subcontainer}>
        <h1 className={styles.subtitle1}>웹에서 간편하게 접근할 수 있는 혁신적인 VR컨텐츠 플랫폼</h1>
        <h1 className={styles.title}>QuasarXR, 새로운 차원의 VR 경험을 만나보세요!</h1>
        <h1 className={styles.subtitle2}></h1>
        
        <div>
          <Link href={redirects.about}> 
            <div className={styles['button-link']}>소개</div>
          </Link>
          {/* <Link href={redirects.demo}> 
            <div className={styles['button-link']}>데모</div>
          </Link> */}
          <Link href={redirects.editor}> 
            <div className={styles['button-link']}>에디터 실행해보기</div>
          </Link>
          {/* <Link href={redirects.document}> 
            <div className={styles['button-link']}>문서</div>
          </Link> */}
          <Link href={redirects.letter}> 
            <div className={styles['button-link']}>문의</div>
          </Link>
        </div>
      </div>      
    </div>
  );
}