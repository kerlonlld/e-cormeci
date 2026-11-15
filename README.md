# Mercado Express

## Controle de acesso

O aplicativo usa Firebase Authentication com Google e autorização no Firestore. Os painéis de Administração e Entregas são exibidos conforme o perfil do usuário; as regras em `firestore.rules` também bloqueiam operações não autorizadas, mesmo quando alguém tenta acessar o Firestore diretamente.

Novos usuários autenticados recebem o perfil `client`. Para conceder acesso privilegiado, localize `users/{uid}` no Firebase Console e altere `role` para:

- `admin`: administração e gerenciamento de produtos e pedidos.
- `integrator`: painel de entregas e pedidos atribuídos ao entregador.

Não permita que o aplicativo cliente altere o campo `role`. Para que um entregador leia um pedido, o documento deve ter `assignedTo` igual ao UID Firebase do entregador.

Antes de publicar as mudanças, implante as regras atualizadas no projeto Firebase:

```sh
firebase deploy --only firestore:rules,firestore:indexes
```

O build do React não implanta nem valida as regras do Firestore.

## Compra e entrega

1. O cliente entra com Google, adiciona itens ao carrinho e abre **Carrinho**.
2. Em **Finalizar compra**, informa nome de quem recebe, telefone e endereço e escolhe dinheiro, PIX ou cartão para pagar na entrega. O checkout registra o pedido; não cobra pagamentos online.
3. O pedido e os dados de contato/endereço ficam disponíveis para a Administração. O administrador confirma o pedido e, quando estiver em preparo, escolhe um entregador.
4. A atribuição coloca o pedido na fila daquele entregador. A área de entregas recebe endereço, telefone, produtos e total.
5. O cliente vê o PIN no histórico de pedidos. O PIN fica numa coleção privada e não é legível pelo entregador; as regras do Firestore validam o código ao confirmar a entrega.

Para disponibilizar o fluxo, publique as regras e índices Firestore atualizados. A conta que fará atribuições deve ter perfil `admin`, e os entregadores devem ter perfil `integrator`.
