// Caminho: src/hooks/useViaCep.js

import { useState } from 'react';
import axios from 'axios';

export function useViaCep() {
  const [address, setAddress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCep = async (cep) => {
    const cleanedCep = cep.replace(/\D/g, '');

    if (cleanedCep.length !== 8) {
      setError('CEP inválido. Deve conter 8 dígitos.');
      return;
    }

    setLoading(true);
    setError('');
    setAddress({});

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      
      if (response.data.erro) {
        setError('CEP não encontrado.');
      } else {
        setAddress({
          logradouro: response.data.logradouro || '',
          bairro: response.data.bairro || '',
          cidade: response.data.localidade || '',
          uf: response.data.uf || '',
        });
      }
    } catch (err) {
      setError('Erro ao conectar com a API de CEP.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { address, loading, error, fetchCep };
}