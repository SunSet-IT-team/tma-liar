import { FC } from "react"
import { Button } from "../../shared/ui/Button"
import { Timer } from "../../shared/ui/Timer"
import styles from './style/choosingLiarStyle.module.scss'
import { Typography } from "../../shared/ui/Typography"
import { Container } from "../../shared/ui/Container"

/**
  * Страница с выбором вранья лжеца
*/
export const ChoosingLiar: FC = () => {
  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <Typography className={styles.title} variant='titleLarge' as="h1">Будешь врать?</Typography>
        <div className={styles.choosingBtns}>
          <Button>Да</Button>
          <Button>нет</Button>
        </div>
      </div>
      <Timer time={10} />
    </Container>
  )
}