import { ImageContainer, ProductContainer, ProductDetailsContainer } from "../../styles/pages/product"
import Image from "next/image"
import { GetStaticPaths, GetStaticProps } from "next"
import { stripe } from "../../lib/stripe"
import Stripe from "stripe"
import { useRouter } from "next/router"
import axios from "axios"
import { useState } from "react"
import Head from "next/head"

interface ProductProps {
    product: {
      id: string;
      name: string;
      imageUrl: string;
      price: string;
      description: string;
      defaultPriceId: string;
    }
  }

export default function Product({ product }: ProductProps) {
    const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)
    const { isFallback } = useRouter()
    if (isFallback) return <p>Loading...</p>

    async function handleBuyProduct() {
      try {
        setIsCreatingCheckoutSession(true)
        const response = await axios.post('/api/checkout', {
            priceId: product.defaultPriceId
        })

        const { checkoutUrl } = response.data

        window.location.href = checkoutUrl
      } catch (err) {
        // Conectar com uma ferramenta de observabilidade (Datadog / Sentry)
        alert('Falha ao redirecionar ao checkout')
        setIsCreatingCheckoutSession(false)
      }
    }

    return (     
        <>
            <Head>
                <title>{product.name} | Ignite Shop</title>
            </Head>
           <ProductContainer>
            <ImageContainer>
                <Image src={product.imageUrl} alt="" width={520} height={480} />
            </ImageContainer>

            <ProductDetailsContainer>
                <h1>{product.name}</h1>
                <span>{product.price}</span>
                <p>{product.description}</p>

                <button disabled={isCreatingCheckoutSession} onClick={handleBuyProduct}>
                    Comprar Agora
                </button>
            </ProductDetailsContainer>
           </ProductContainer>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [
           {params: { id: 'prod_P5OJW6tdyMo55r' }}
        ],
        fallback: "blocking",
    }   
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({params}) => {

    const productId = params.id

    const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
    })
    const price = product.default_price as Stripe.Price


    return {
        props: {
            product: {
            id: product.id,
            name: product.name,
            price: new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(price.unit_amount / 100),
            description: product.description,
            imageUrl: product.images[0],
            defaultPriceId: price.id
        }},
        revalidate: 60 * 60 * 1 //1 hour
    }
}