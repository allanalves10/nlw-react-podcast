import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import { api } from '../../services/api';
import { convertDurationToTimeString } from '../../utils/converDurationToTimeString';
import styles from './episode.module.scss';
import { PlayerContext } from '../../contexts/PlayerContext';
import { useContext } from 'react';

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    description: string;
    members: string;
    publishedAt: string;
    duration: number;
    durationAsString: string;
    url: string;
}

type EpisodeProps = {
    episode: Episode;
}

export default function Episode({ episode }: EpisodeProps) {
    const { play } = useContext(PlayerContext);
    
    return(
        <div className={styles.episode}>
            <Head>
                <title>{episode.title} | Podcast</title>
            </Head>
            <div className={styles.thumbnailContainer}>
                 <Link href='/'>
                    <button type="button">
                        <img src="/arrow-left.svg" alt="Voltar"/>
                    </button>
                 </Link>
                <Image 
                    height={160} 
                    width={700} 
                    src={episode.thumbnail} 
                    objectFit="cover"
                />
                <button type="button" onClick={() => play(episode)}>
                    <img src="/play.svg" alt="Tocar Episódio"/>
                </button>
            </div>
            <header>
                <h1>{episode.title}</h1>
                <span>{episode.members}</span>
                <span>{episode.publishedAt}</span>
                <span>{episode.durationAsString}</span>
            </header>

            <div className={styles.description} dangerouslySetInnerHTML={{__html: episode.description}}/>
        </div>
    );
}

//Método que é chamado quando o conteúdo é dinâmico.
// fallback = 'blocking' espera o carregamento das informações para navegar a tela
export const getStaticPaths: GetStaticPaths = async () => {
    //carregar os dois primeiros episódiosde maneira estática
    const { data } = await api.get('episodes', {
        params: {
          _limit: 2,
          _sort: 'published_at',
          _order: 'desc',
        }
    });

    const paths = data.map(episode => {
        return {
            params: {
                slug: episode.id,
            }
        }
    })
    return{
        paths,
        fallback: 'blocking',
    }
}

export const getStaticProps: GetStaticProps = async (context) => {
    const { slug } = context.params;

    const { data } = await api.get(`episodes/${slug}`)

    const episode = {
        id: data.id,
        title: data.title,
        members: data.members,
        thumbnail: data.thumbnail,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', {locale: ptBR}),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url,
      };
    return {
        props: {
            episode,
        },
        revalidate: 60 * 60 * 24, // 24 hours
    }
}