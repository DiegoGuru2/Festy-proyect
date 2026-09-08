import 'package:flutter/material.dart';

void main() {
  runApp(const FestyApp());
}

class FestyApp extends StatelessWidget {
  const FestyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Festy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0F19),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8B5CF6),
          secondary: Color(0xFFEC4899),
          surface: Color(0xFF121826),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        elevation: 0,
        title: Row(
          children: const [
            Text('🎂 ', style: TextStyle(fontSize: 24)),
            Text(
              'Festy',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.group_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner informativo
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Modo Offline-First Activo',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Próximos Cumpleaños',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Tus fechas están sincronizadas en tu dispositivo localmente.',
                    style: TextStyle(fontSize: 13, color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Septiembre 2026',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // Tarjetas de muestra
            _buildBirthdayCard('Sofía Gurumendi', 'Familia', '12 de Septiembre', 'En 5 días'),
            _buildBirthdayCard('Carlos Mendoza', 'Amigos', '18 de Septiembre', 'En 11 días'),
            _buildBirthdayCard('Abuela Rosa', 'Familia', '25 de Septiembre', 'En 18 días'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: const Color(0xFF8B5CF6),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Cumpleaños', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildBirthdayCard(String name, String circle, String date, String remaining) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF121826),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Colors.white10),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.2),
          child: Text(name[0], style: const TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold)),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('$circle • $date', style: const TextStyle(color: Colors.white60, fontSize: 12)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF8B5CF6).withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            remaining,
            style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
